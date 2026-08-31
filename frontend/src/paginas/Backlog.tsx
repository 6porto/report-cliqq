import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useBacklogSemCriticidade } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import {
  ordenarIssuesPor,
  tiposDistintos,
  valoresDistintos,
  type ColunaDeIssue,
  type OrdenacaoDeIssues,
} from '../dominio/ordenacao-de-issues';
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
  { chave: 'sistema', rotulo: 'Sistema' },
  { chave: 'estado', rotulo: 'Estado' },
  { chave: 'responsavel', rotulo: 'Responsável' },
  { chave: 'criadaEm', rotulo: 'Criada há' },
];

/** A triagem começa por aqui: o que já foi priorizado e o que ainda espera priorização. */
const ESTADOS_PADRAO = ['priorizado', 'pendente-priorizacao'];

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
  const [tipo, setTipo] = useState('');
  /**
   * `null` significa que a escolha ainda é a padrão; a partir do primeiro
   * clique vira a lista do usuário, e uma lista vazia mostra todos os estados.
   */
  const [escolhaDeEstados, setEscolhaDeEstados] = useState<string[] | null>(null);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoDeIssues | null>(null);
  const backlog = useBacklogSemCriticidade(dias);

  const issues = useMemo(() => backlog.data?.issues ?? [], [backlog.data]);
  const tipos = useMemo(() => tiposDistintos(issues), [issues]);
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

  const filtradas = useMemo(
    () =>
      issues.filter(
        (issue) =>
          (!tipo || issue.tipos.includes(tipo)) &&
          (estadosEscolhidos.length === 0 ||
            estadosEscolhidos.includes(issue.estado ?? '')),
      ),
    [issues, tipo, estadosEscolhidos],
  );

  /** Contagem por estado dentro do que o filtro de tipo já deixou passar. */
  const contagemPorEstado = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const issue of issues) {
      if (tipo && !issue.tipos.includes(tipo)) {
        continue;
      }

      const chave = issue.estado ?? '';
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }

    return contagem;
  }, [issues, tipo]);

  const alternarEstado = (valor: string) =>
    setEscolhaDeEstados(
      estadosEscolhidos.includes(valor)
        ? estadosEscolhidos.filter((item) => item !== valor)
        : [...estadosEscolhidos, valor],
    );

  const ordenadas = ordenarIssuesPor(filtradas, ordenacao);
  const mostradas = ordenadas.slice(0, visiveis);

  const trocarPeriodo = (novo: number | null) => {
    setDias(novo);
    setVisiveis(POR_VEZ);
    setTipo('');
    setEscolhaDeEstados(null);
  };

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
      acoes={
        <div className="filtros">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.rotulo}
              type="button"
              className={dias === periodo.dias ? 'aba primario' : 'aba'}
              aria-pressed={dias === periodo.dias}
              onClick={() => trocarPeriodo(periodo.dias)}
            >
              {periodo.rotulo}
            </button>
          ))}
        </div>
      }
    >
      {backlog.isError ? <p className="erro">{mensagemDoErro(backlog.error)}</p> : null}
      {backlog.isLoading ? <p className="carregando">Carregando o backlog…</p> : null}

      {backlog.data ? (
        <p className="assistente-apoio nota-da-etapa">
          <strong>{issues.length}</strong> de {backlog.data.total} issues abertas{' '}
          {dias === null ? 'no projeto' : `nos últimos ${dias} dias`} estão sem criticidade.
        </p>
      ) : null}

      {issues.length > 0 ? (
        <div className="filtros">
          <select value={tipo} onChange={(evento) => setTipo(evento.target.value)} aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {tipos.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>

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
                    <td>{issue.sistema ?? '—'}</td>
                    <td>{issue.estado ?? '—'}</td>
                    <td>{issue.responsavel ?? '—'}</td>
                    <td title={`aberta em ${formatarData(issue.criadaEm)}`}>
                      {diasEmAberto(issue.criadaEm)}
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
    </CartaoGrafico>
  );
}
