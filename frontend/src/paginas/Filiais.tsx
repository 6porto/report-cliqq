import { useState } from 'react';
import { useFiliais, useFiltros } from '../api/hooks';
import type { CampoOrdenavel, Filial, FiltroFiliais, StatusRollout } from '../api/tipos';
import { FormularioLoja } from '../componentes/FormularioLoja';
import { TabelaFiliais } from '../componentes/TabelaFiliais';
import { ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';

export function Filiais() {
  const [filtro, setFiltro] = useState<FiltroFiliais>({ pagina: 1, tamanho: 50 });
  const [lojaEmEdicao, setLojaEmEdicao] = useState<Filial | null>(null);
  const filtros = useFiltros();
  const filiais = useFiliais(filtro);

  const aplicar = (parcial: Partial<FiltroFiliais>) =>
    setFiltro((anterior) => ({ ...anterior, ...parcial, pagina: 1 }));

  const ordenar = (campo: CampoOrdenavel) =>
    setFiltro((anterior) => ({
      ...anterior,
      ordenarPor: campo,
      direcao: anterior.ordenarPor === campo && anterior.direcao === 'asc' ? 'desc' : 'asc',
      pagina: 1,
    }));

  const totalPaginas = filiais.data
    ? Math.max(1, Math.ceil(filiais.data.total / filiais.data.tamanho))
    : 1;

  return (
    <>
    <section className="cartao">
      <div className="filtros">
        <input
          placeholder="Buscar código, nome ou cidade"
          aria-label="Busca"
          onChange={(evento) => aplicar({ busca: evento.target.value || undefined })}
        />
        <select
          aria-label="Status"
          onChange={(evento) =>
            aplicar({ status: (evento.target.value || undefined) as StatusRollout | undefined })
          }
        >
          <option value="">Todos os status</option>
          {ORDEM_PILHA_STATUS.map((status) => (
            <option key={status} value={status}>
              {ROTULO_STATUS[status]}
            </option>
          ))}
        </select>
        <select
          aria-label="UF"
          onChange={(evento) => aplicar({ uf: evento.target.value || undefined })}
        >
          <option value="">Todas as UFs</option>
          {filtros.data?.ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        <select
          aria-label="Onda"
          onChange={(evento) => aplicar({ onda: evento.target.value || undefined })}
        >
          <option value="">Todas as ondas</option>
          {filtros.data?.ondas.map((onda) => (
            <option key={onda} value={onda}>
              {onda}
            </option>
          ))}
        </select>
      </div>

      {filiais.data ? (
        <>
          <TabelaFiliais
            filiais={filiais.data.itens}
            ordenacao={
              filtro.ordenarPor
                ? { campo: filtro.ordenarPor, direcao: filtro.direcao ?? 'asc' }
                : null
            }
            aoOrdenar={ordenar}
            aoEditar={setLojaEmEdicao}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <button
              className="aba"
              disabled={(filtro.pagina ?? 1) <= 1}
              onClick={() =>
                setFiltro((anterior) => ({ ...anterior, pagina: (anterior.pagina ?? 1) - 1 }))
              }
            >
              Anterior
            </button>
            <span style={{ color: 'var(--tinta-secundaria)' }}>
              Página {filiais.data.pagina} de {totalPaginas} — {filiais.data.total} lojas
            </span>
            <button
              className="aba"
              disabled={(filtro.pagina ?? 1) >= totalPaginas}
              onClick={() =>
                setFiltro((anterior) => ({ ...anterior, pagina: (anterior.pagina ?? 1) + 1 }))
              }
            >
              Próxima
            </button>
          </div>
        </>
      ) : (
        <p className="carregando">Carregando lojas…</p>
      )}
    </section>

    {lojaEmEdicao ? (
      <FormularioLoja loja={lojaEmEdicao} aoFechar={() => setLojaEmEdicao(null)} />
    ) : null}
    </>
  );
}
