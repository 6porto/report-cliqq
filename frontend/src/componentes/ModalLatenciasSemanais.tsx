import { useEffect, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useLatenciasSemanais,
  useRemoverLatenciaSemanal,
  useSalvarLatenciaSemanal,
} from '../api/hooks';
import type { LatenciaSemanal } from '../api/tipos';
import { formatarSemanaCompleta, hoje, paraCampoData } from '../dominio/semanas';

interface Props {
  aoFechar: () => void;
}

export function ModalLatenciasSemanais({ aoFechar }: Props) {
  const latencias = useLatenciasSemanais();
  const salvarLatencia = useSalvarLatenciaSemanal();
  const removerLatencia = useRemoverLatenciaSemanal();

  const [semana, setSemana] = useState(hoje);
  const [p50, setP50] = useState('');
  const [p75, setP75] = useState('');
  const [p95, setP95] = useState('');
  const [p99, setP99] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const lancamentos = [...(latencias.data ?? [])].reverse();
  const salvando = salvarLatencia.isPending || removerLatencia.isPending;
  const jaLancada = (latencias.data ?? []).some(
    (latencia) => paraCampoData(latencia.semana) === semana,
  );

  const salvar = async () => {
    setErro(null);

    if (!semana) {
      setErro('Informe o dia inicial da semana.');
      return;
    }

    const campos = [p50, p75, p95, p99];
    const valores = campos.map(Number);

    if (
      campos.some((campo) => campo.trim() === '') ||
      valores.some((valor) => !Number.isInteger(valor) || valor < 0)
    ) {
      setErro('Os percentis devem ser inteiros de milissegundos, iguais ou maiores que zero.');
      return;
    }

    const [valorP50, valorP75, valorP95, valorP99] = valores;

    if (valores.some((valor, indice) => indice > 0 && valor < valores[indice - 1])) {
      setErro('Os percentis devem crescer: P50 ≤ P75 ≤ P95 ≤ P99.');
      return;
    }

    try {
      await salvarLatencia.mutateAsync({
        semana,
        p50: valorP50,
        p75: valorP75,
        p95: valorP95,
        p99: valorP99,
      });
      setP50('');
      setP75('');
      setP95('');
      setP99('');
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  const editar = (latencia: LatenciaSemanal) => {
    setSemana(paraCampoData(latencia.semana));
    setP50(String(latencia.p50));
    setP75(String(latencia.p75));
    setP95(String(latencia.p95));
    setP99(String(latencia.p99));
    setConfirmandoExclusao(null);
    setErro(null);
  };

  const remover = async (id: number) => {
    setErro(null);

    try {
      await removerLatencia.mutateAsync(id);
      setConfirmandoExclusao(null);
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  const aoTeclarNoCampo = (evento: { key: string }) => {
    if (evento.key === 'Enter') {
      void salvar();
    }
  };

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Lançamentos de latência semanal"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>Latência das requisições</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="lancamento-semana">
          <label className="campo">
            <span>Semana (dia inicial)</span>
            <input
              type="date"
              value={semana}
              onChange={(evento) => setSemana(evento.target.value)}
            />
          </label>
          <label className="campo">
            <span>P50 (ms)</span>
            <input
              type="number"
              min={0}
              value={p50}
              placeholder="ex.: 120"
              onChange={(evento) => setP50(evento.target.value)}
              onKeyDown={aoTeclarNoCampo}
            />
          </label>
          <label className="campo">
            <span>P75 (ms)</span>
            <input
              type="number"
              min={0}
              value={p75}
              placeholder="ex.: 200"
              onChange={(evento) => setP75(evento.target.value)}
              onKeyDown={aoTeclarNoCampo}
            />
          </label>
          <label className="campo">
            <span>P95 (ms)</span>
            <input
              type="number"
              min={0}
              value={p95}
              placeholder="ex.: 480"
              onChange={(evento) => setP95(evento.target.value)}
              onKeyDown={aoTeclarNoCampo}
            />
          </label>
          <label className="campo">
            <span>P99 (ms)</span>
            <input
              type="number"
              min={0}
              value={p99}
              placeholder="ex.: 900"
              onChange={(evento) => setP99(evento.target.value)}
              onKeyDown={aoTeclarNoCampo}
            />
          </label>
          <button className="aba primario" onClick={salvar} disabled={salvando}>
            {salvarLatencia.isPending ? 'Salvando…' : jaLancada ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>

        <p className="aviso">
          {jaLancada
            ? 'Essa semana já tem lançamento — salvar substitui os valores registrados.'
            : 'Um lançamento por semana, identificado pelo dia inicial: salvar a mesma data de novo corrige os valores.'}
        </p>

        {erro ? <p className="erro">{erro}</p> : null}

        <div className="tabela-envolucro lista-lancamentos">
          {latencias.isLoading ? (
            <p className="carregando">Carregando…</p>
          ) : lancamentos.length === 0 ? (
            <p className="carregando">Nenhum lançamento registrado ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Semana de</th>
                  <th style={{ textAlign: 'right' }}>P50</th>
                  <th style={{ textAlign: 'right' }}>P75</th>
                  <th style={{ textAlign: 'right' }}>P95</th>
                  <th style={{ textAlign: 'right' }}>P99</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((latencia) => (
                  <tr key={latencia.id}>
                    <td>{formatarSemanaCompleta(paraCampoData(latencia.semana))}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {latencia.p50.toLocaleString('pt-BR')} ms
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {latencia.p75.toLocaleString('pt-BR')} ms
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {latencia.p95.toLocaleString('pt-BR')} ms
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {latencia.p99.toLocaleString('pt-BR')} ms
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {confirmandoExclusao === latencia.id ? (
                        <>
                          <button
                            className="aba perigo"
                            onClick={() => remover(latencia.id)}
                            disabled={salvando}
                          >
                            Confirmar
                          </button>{' '}
                          <button
                            className="aba"
                            onClick={() => setConfirmandoExclusao(null)}
                            disabled={salvando}
                          >
                            Manter
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="aba"
                            onClick={() => editar(latencia)}
                            disabled={salvando}
                          >
                            Editar
                          </button>{' '}
                          <button
                            className="aba perigo"
                            onClick={() => setConfirmandoExclusao(latencia.id)}
                            disabled={salvando}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="acoes-form">
          <span style={{ flex: 1 }} />
          <button className="aba" onClick={aoFechar} disabled={salvando}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
