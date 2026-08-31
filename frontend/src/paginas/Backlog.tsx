import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useBacklogSemCriticidade, useDefinirCriticidade } from '../api/hooks';
import type { IssueDaVersao, RespostaPriorizacao } from '../api/tipos';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { ModalPriorizarIssue, pontuacao } from '../componentes/ModalPriorizarIssue';
import {
  ordenarIssuesPor,
  tiposDistintos,
  valoresDistintos,
  type ColunaDeIssue,
  type OrdenacaoDeIssues,
} from '../dominio/ordenacao-de-issues';
import type { Criticidade } from '../dominio/priorizacao';
import { classeDoTipo } from '../dominio/tipos-de-issue';

const PERIODOS: { rotulo: string; dias: number | null }[] = [
  { rotulo: '7 dias', dias: 7 },
  { rotulo: '15 dias', dias: 15 },
  { rotulo: '30 dias', dias: 30 },
  { rotulo: 'Tudo', dias: null },
];

const COLUNAS: { chave: ColunaDeIssue; rotulo: string }[] = [
  { chave: 'id', rotulo: 'Issue' },
  { chave: 'titulo', rotulo: 'Título' },
  { chave: 'tipos', rotulo: 'Tipo' },
  { chave: 'estado', rotulo: 'Estado' },
  { chave: 'autor', rotulo: 'Autor' },
  { chave: 'criadaEm', rotulo: 'Criada há' },
];

const RESPOSTA_VAZIA: RespostaPriorizacao = {
  beneficiados: null,
  tipoDeGanho: null,
  frequencia: null,
  riscoDeAdiar: null,
  contorno: null,
  esforco: null,
};

/** A triagem começa por aqui: o que já foi priorizado e o que ainda espera priorização. */
const ESTADOS_PADRAO = ['priorizado', 'pendente-priorizacao'];

/** Tipos que não entram marcados de saída. */
const TIPOS_FORA_DO_PADRAO = ['bug'];

/** Quantas linhas aparecem antes do "ver mais" — o backlog inteiro passa de 190. */
const POR_VEZ = 50;

/** Há quantos dias a issue está aberta, contando dias inteiros. */
function diasEmAberto(criadaEm: string, agora = new Date()) {
  const dias = Math.floor((agora.getTime() - new Date(criadaEm).getTime()) / 86_400_000);

  if (dias <= 0) {
    return 'hoje';
  }

  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString('pt-BR');
}

export function Backlog() {
  const [dias, setDias] = useState<number | null>(7);
  const [visiveis, setVisiveis] = useState(POR_VEZ);
  /** `null` mantém o padrão: todos os tipos menos bug. */
  const [escolhaDeTipos, setEscolhaDeTipos] = useState<string[] | null>(null);
  /**
   * `null` significa que a escolha ainda é a padrão; a partir do primeiro
   * clique vira a lista do usuário, e uma lista vazia mostra todos os estados.
   */
  const [escolhaDeEstados, setEscolhaDeEstados] = useState<string[] | null>(null);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoDeIssues | null>(null);
  /** Respostas por issue; vivem só nesta tela até haver onde gravar. */
  const [respostas, setRespostas] = useState<Record<number, RespostaPriorizacao>>({});
  /** Só as escolhas manuais: sem entrada aqui, vale a criticidade sugerida. */
  const [criticidades, setCriticidades] = useState<Record<number, Criticidade>>({});
  const [priorizando, setPriorizando] = useState<number | null>(null);
  const backlog = useBacklogSemCriticidade(dias);
  const definirCriticidade = useDefinirCriticidade();

  const issues = useMemo(() => backlog.data?.issues ?? [], [backlog.data]);
  /** Issue sem `type::` também vira opção, como acontece com os estados. */
  const tipos = useMemo(() => {
    const comTipo = tiposDistintos(issues);
    const temSemTipo = issues.some((issue) => issue.tipos.length === 0);

    return temSemTipo ? [...comTipo, ''] : comTipo;
  }, [issues]);

  /** Bug fica de fora do padrão: a triagem começa pelo que ainda vira demanda. */
  const tiposEscolhidos = useMemo(
    () => escolhaDeTipos ?? tipos.filter((tipo) => !TIPOS_FORA_DO_PADRAO.includes(tipo)),
    [escolhaDeTipos, tipos],
  );

  const combinaComTipo = (issue: IssueDaVersao) =>
    tiposEscolhidos.length === 0 ||
    (issue.tipos.length === 0
      ? tiposEscolhidos.includes('')
      : issue.tipos.some((tipo) => tiposEscolhidos.includes(tipo)));
  /** Issue sem `state::` também é uma opção: entra como '' no fim da lista. */
  const estados = useMemo(() => {
    const comEstado = valoresDistintos(issues, 'estado');
    const temSemEstado = issues.some((issue) => !issue.estado);

    return temSemEstado ? [...comEstado, ''] : comEstado;
  }, [issues]);

  /** Só entram no padrão os estados que existem na janela carregada. */
  const estadosEscolhidos = useMemo(
    () => escolhaDeEstados ?? ESTADOS_PADRAO.filter((estado) => estados.includes(estado)),
    [escolhaDeEstados, estados],
  );

  const combinaComEstado = (issue: IssueDaVersao) =>
    estadosEscolhidos.length === 0 || estadosEscolhidos.includes(issue.estado ?? '');

  const filtradas = useMemo(
    () => issues.filter((issue) => combinaComTipo(issue) && combinaComEstado(issue)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [issues, tiposEscolhidos, estadosEscolhidos],
  );

  /** Cada contagem já considera o outro filtro: o número diz o que sobraria. */
  const contagemPorEstado = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const issue of issues.filter(combinaComTipo)) {
      const chave = issue.estado ?? '';
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }

    return contagem;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, tiposEscolhidos]);

  const contagemPorTipo = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const issue of issues.filter(combinaComEstado)) {
      for (const chave of issue.tipos.length > 0 ? issue.tipos : ['']) {
        contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
      }
    }

    return contagem;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, estadosEscolhidos]);

  const alternarEstado = (valor: string) =>
    setEscolhaDeEstados(
      estadosEscolhidos.includes(valor)
        ? estadosEscolhidos.filter((item) => item !== valor)
        : [...estadosEscolhidos, valor],
    );

  const alternarTipo = (valor: string) =>
    setEscolhaDeTipos(
      tiposEscolhidos.includes(valor)
        ? tiposEscolhidos.filter((item) => item !== valor)
        : [...tiposEscolhidos, valor],
    );

  const ordenadas = ordenarIssuesPor(filtradas, ordenacao);
  const mostradas = ordenadas.slice(0, visiveis);

  const trocarPeriodo = (novo: number | null) => {
    setDias(novo);
    setVisiveis(POR_VEZ);
    setEscolhaDeTipos(null);
    setEscolhaDeEstados(null);
  };

  const responder = (id: number, campo: keyof RespostaPriorizacao, pontos: number) =>
    setRespostas((atual) => ({
      ...atual,
      [id]: { ...(atual[id] ?? RESPOSTA_VAZIA), [campo]: pontos },
    }));

  const aberta = mostradas.find((issue) => issue.id === priorizando) ?? null;

  const alternarOrdem = (coluna: ColunaDeIssue) =>
    setOrdenacao((atual) =>
      atual?.coluna === coluna
        ? { coluna, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { coluna, direcao: 'asc' },
    );

  return (
    <CartaoGrafico
      largo
      titulo="Sem criticidade definida"
      subtitulo="Issues abertas que passaram pela triagem sem receber criticidade::"
    >
      {backlog.isError ? <p className="erro">{mensagemDoErro(backlog.error)}</p> : null}

      <fieldset className="filtro-estados estados-do-backlog">
        <legend>Aberta nos últimos</legend>
        <div className="opcoes">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.rotulo}
              type="button"
              className={dias === periodo.dias ? 'opcao opcao-marcada' : 'opcao'}
              aria-pressed={dias === periodo.dias}
              onClick={() => trocarPeriodo(periodo.dias)}
            >
              <span>{periodo.rotulo}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {backlog.isLoading ? <p className="carregando">Carregando o backlog…</p> : null}

      {backlog.data ? (
        <p className="assistente-apoio nota-da-etapa">
          <strong>{issues.length}</strong> de {backlog.data.total} issues abertas{' '}
          {dias === null ? 'no projeto' : `nos últimos ${dias} dias`} estão sem criticidade.
        </p>
      ) : null}

      {issues.length > 0 ? (
        <fieldset className="filtro-estados estados-do-backlog">
          <legend>
            Tipos{' '}
            {tiposEscolhidos.length === 0 ? '· nenhum marcado mostra todos' : '· clique para tirar'}
          </legend>
          <div className="opcoes">
            {tipos.map((valor) => {
              const marcado = tiposEscolhidos.includes(valor);

              return (
                <button
                  key={valor}
                  type="button"
                  className={marcado ? 'opcao opcao-marcada' : 'opcao'}
                  aria-pressed={marcado}
                  onClick={() => alternarTipo(valor)}
                >
                  <span>{valor || 'sem tipo'}</span>
                  <span className="opcao-pontos">{contagemPorTipo.get(valor) ?? 0}</span>
                </button>
              );
            })}
            {tiposEscolhidos.length < tipos.length ? (
              <button
                type="button"
                className="ligacao"
                onClick={() => setEscolhaDeTipos([...tipos])}
              >
                marcar todos
              </button>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {issues.length > 0 ? (
        <div className="filtros">
          <span className="assistente-apoio">
            {filtradas.length} de {issues.length} listadas
          </span>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <fieldset className="filtro-estados estados-do-backlog">
          <legend>
            Estados{' '}
            {estadosEscolhidos.length === 0 ? '· nenhum marcado mostra todos' : '· clique para tirar'}
          </legend>
          <div className="opcoes">
            {estados.map((valor) => {
              const marcado = estadosEscolhidos.includes(valor);

              return (
                <button
                  key={valor}
                  type="button"
                  className={marcado ? 'opcao opcao-marcada' : 'opcao'}
                  aria-pressed={marcado}
                  onClick={() => alternarEstado(valor)}
                >
                  <span>{valor || 'sem estado'}</span>
                  <span className="opcao-pontos">{contagemPorEstado.get(valor) ?? 0}</span>
                </button>
              );
            })}
            {estadosEscolhidos.length < estados.length ? (
              <button
                type="button"
                className="ligacao"
                onClick={() => setEscolhaDeEstados([...estados])}
              >
                marcar todos
              </button>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {backlog.data && issues.length === 0 ? (
        <p className="carregando">
          Todas as issues do período já têm criticidade — nada para triar aqui.
        </p>
      ) : null}

      {issues.length > 0 && filtradas.length === 0 ? (
        <p className="carregando">Nenhuma issue com esses filtros.</p>
      ) : null}

      {filtradas.length > 0 ? (
        <>
          <div className="tabela-envolucro">
            <table>
              <thead>
                <tr>
                  {COLUNAS.map((coluna) => {
                    const ativa = ordenacao?.coluna === coluna.chave;

                    return (
                      <th
                        key={coluna.chave}
                        aria-sort={
                          ativa
                            ? ordenacao.direcao === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        <button
                          type="button"
                          className={ativa ? 'ordenar ordenar-ativa' : 'ordenar'}
                          onClick={() => alternarOrdem(coluna.chave)}
                        >
                          {coluna.rotulo}
                          <span aria-hidden>
                            {ativa ? (ordenacao.direcao === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                  <th>Priorização</th>
                </tr>
              </thead>
              <tbody>
                {mostradas.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <a className="issue-id" href={issue.url} target="_blank" rel="noreferrer">
                        #{issue.id}
                      </a>
                    </td>
                    <td className="celula-titulo">{issue.titulo}</td>
                    <td>
                      {issue.tipos.length > 0
                        ? issue.tipos.map((valor) => (
                            <span
                              className={`issue-marcador ${classeDoTipo(valor)}`.trim()}
                              key={valor}
                            >
                              {valor}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td>{issue.estado ?? '—'}</td>
                    <td>{issue.autor ?? '—'}</td>
                    <td title={`aberta em ${formatarData(issue.criadaEm)}`}>
                      {diasEmAberto(issue.criadaEm)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="aba"
                        onClick={() => setPriorizando(issue.id)}
                      >
                        {pontuacao(respostas[issue.id] ?? null).score === null
                          ? 'Priorizar'
                          : `Score ${pontuacao(respostas[issue.id] ?? null).score}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtradas.length > mostradas.length ? (
            <button
              type="button"
              className="aba"
              onClick={() => setVisiveis((atual) => atual + POR_VEZ)}
            >
              Ver mais {Math.min(POR_VEZ, filtradas.length - mostradas.length)} de{' '}
              {filtradas.length - mostradas.length} restantes
            </button>
          ) : null}
        </>
      ) : null}

      {aberta ? (
        <ModalPriorizarIssue
          issue={aberta}
          resposta={respostas[aberta.id] ?? null}
          criticidade={criticidades[aberta.id] ?? null}
          salvando={definirCriticidade.isPending}
          erroAoSalvar={definirCriticidade.isError ? mensagemDoErro(definirCriticidade.error) : null}
          aoResponder={(campo, pontos) => responder(aberta.id, campo, pontos)}
          aoEscolherCriticidade={(criticidade) =>
            setCriticidades((atual) => ({ ...atual, [aberta.id]: criticidade }))
          }
          aoAplicar={(criticidade) =>
            definirCriticidade.mutate(
              { iid: aberta.id, criticidade },
              { onSuccess: () => setPriorizando(null) },
            )
          }
          aoFechar={() => setPriorizando(null)}
        />
      ) : null}
    </CartaoGrafico>
  );
}
