"use client";

import { useMemo, useState } from "react";
import type { Anuncio } from "@/lib/steam";

const FAIXAS = [
  { curto: "FN", nome: "Original de Fábrica", ate: 0.07 },
  { curto: "MW", nome: "Pouco Usada", ate: 0.15 },
  { curto: "FT", nome: "Testada no Terreno", ate: 0.38 },
  { curto: "WW", nome: "Bem Desgastada", ate: 0.45 },
  { curto: "BS", nome: "Veterana de Guerra", ate: 1 },
];

const CORES_RARIDADE: Record<string, string> = {
  "Padrão Doméstico": "#b0c3d9",
  "Grau Industrial": "#5e98d9",
  "Nível Militar": "#4b69ff",
  Restrito: "#8847ff",
  Secreto: "#d32ce6",
  Oculto: "#eb4b4b",
  Contrabando: "#e4ae39",
  "Qualidade Básica": "#4a5160",
  "Alta Qualidade": "#5e98d9",
  Extraordinário: "#e4ae39",
};

const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Cadeado() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5V3.6A2 2 0 0 1 8 3.6V5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Setinha() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.2 4.6 8.8 10 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

function Mira() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" stroke="#4b69ff" strokeWidth="1.6" />
      <path d="M12 1.6v4.2M12 18.2v4.2M1.6 12h4.2M18.2 12h4.2" stroke="#e9ecf2" strokeWidth="1.6" strokeLinecap="square" />
      <circle cx="12" cy="12" r="1.7" fill="#4b69ff" />
    </svg>
  );
}

function BarraDesgaste({ valor }: { valor: number }) {
  return (
    <div className="desgaste">
      <div className="trilho">
        {FAIXAS.map((f, i) => {
          const inicio = i === 0 ? 0 : FAIXAS[i - 1].ate;
          return (
            <span key={f.curto} style={{ flexGrow: f.ate - inicio, opacity: 0.22 + i * 0.15 }} title={f.nome} />
          );
        })}
        <i className="marca" style={{ left: `${Math.min(valor, 1) * 100}%` }} />
      </div>
      <div className="regua">
        <span>0</span>
        <span>0,07</span>
        <span>0,15</span>
        <span>0,38</span>
        <span>1</span>
      </div>
    </div>
  );
}

function Cartao({ a, atraso, destaque }: { a: Anuncio; atraso: number; destaque?: boolean }) {
  return (
    <article className={destaque ? "item realce" : "item"} style={{ animationDelay: `${atraso}ms` }}>
      <div className="raro" style={{ background: CORES_RARIDADE[a.raridade || ""] || "#3a4356" }} />
      <div className="foto">
        {a.imagem ? (
          <img src={a.imagem} alt={`${a.arma} ${a.skin}`} loading={destaque ? "eager" : "lazy"} />
        ) : null}
      </div>
      <div className="corpo">
        <div className="nome">
          {a.arma}
          <span>{a.skin || a.categoria}</span>
        </div>

        {a.desgaste !== null ? (
          <>
            <BarraDesgaste valor={a.desgaste} />
            <dl className="dados">
              <div>
                <dt>desgaste</dt>
                <dd>{a.desgaste.toFixed(6).replace(".", ",")}</dd>
              </div>
              <div>
                <dt>padrão</dt>
                <dd>{a.padrao ?? "-"}</dd>
              </div>
            </dl>
          </>
        ) : (
          <dl className="dados">
            <div>
              <dt>tipo</dt>
              <dd>{a.categoria}</dd>
            </div>
            <div>
              <dt>exterior</dt>
              <dd>{a.exterior || "sem desgaste"}</dd>
            </div>
          </dl>
        )}

        <span className={a.negociavel ? "selo" : "selo trava"}>
          {a.negociavel ? <Setinha /> : <Cadeado />}
          {a.negociavel ? "pode ser enviada hoje" : "travada pela Steam"}
        </span>

        <div className="pe">
          <div>
            <small>preço de referência</small>
            <b>{real.format(a.preco)}</b>
          </div>
          <div className="economia">
            <small>na Steam</small>
            <span>{real.format(Math.round(a.preco * 1.32))}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Vitrine({
  iniciais,
  steamIdInicial,
}: {
  iniciais: Anuncio[];
  steamIdInicial: string;
}) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>(iniciais);
  const [steamId, setSteamId] = useState(steamIdInicial);
  const [campo, setCampo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [limite, setLimite] = useState(false);
  const [filtro, setFiltro] = useState<"tudo" | "hoje" | "travadas">("tudo");
  const [proprio, setProprio] = useState(false);

  const comDesgaste = anuncios.filter((a) => a.desgaste !== null);
  const travadas = anuncios.filter((a) => !a.negociavel).length;
  const destaque = comDesgaste[0] ?? anuncios[0] ?? null;

  const lista = useMemo(() => {
    if (filtro === "hoje") return anuncios.filter((a) => a.negociavel);
    if (filtro === "travadas") return anuncios.filter((a) => !a.negociavel);
    return anuncios;
  }, [anuncios, filtro]);

  const parAnalise = useMemo(() => {
    const ordenado = anuncios.filter((a) => a.desgaste !== null).sort((x, y) => (x.desgaste ?? 0) - (y.desgaste ?? 0));
    if (ordenado.length < 2) return null;
    return { melhor: ordenado[0], pior: ordenado[ordenado.length - 1] };
  }, [anuncios]);

  async function buscar(evento: React.FormEvent) {
    evento.preventDefault();
    const id = campo.replace(/[^0-9]/g, "");
    if (!id) return;
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/inventario?steamid=${id}`);
      const dados = await resposta.json();
      if (dados.erro) {
        setErro(dados.erro);
        setLimite(dados.upstream === 429);
      } else {
        setAnuncios(dados.anuncios);
        setSteamId(dados.steamId);
        setProprio(true);
        setLimite(false);
        setFiltro("tudo");
      }
    } catch {
      setErro("Não consegui falar com a Steam agora. Tente de novo em alguns segundos.");
      setLimite(false);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <header className="topo">
        <div className="envolve">
          <div className="marca">
            <Mira />
            <div className="letras">
              <b>VITRINE</b>
              <span>mercado P2P de skins CS2</span>
            </div>
          </div>
          <div className="aovivo">
            <i className="ponto" />
            inventário lido na Steam
          </div>
        </div>
      </header>

      <main>
        <section className="capa">
          <div className="envolve dobra">
            <div>
              <h1>
                Cada skin é um <em>anúncio</em>, não uma linha de catálogo.
              </h1>
              <p>
                Duas AK-47 Redline com o mesmo nome não valem a mesma coisa. Quem decide é o desgaste, o
                padrão e o estado de troca do item. Esta página lê um inventário de verdade e monta o
                anúncio de cada peça, uma por uma.
              </p>
              <form className="busca" onSubmit={buscar}>
                <label htmlFor="steamid">SteamID64 do vendedor</label>
                <input
                  id="steamid"
                  value={campo}
                  onChange={(e) => setCampo(e.target.value)}
                  placeholder={steamIdInicial}
                  inputMode="numeric"
                  maxLength={20}
                />
                <button type="submit" disabled={carregando}>
                  {carregando ? "Lendo inventário" : "Ler inventário"}
                </button>
                <p className="dica">
                  Funciona com qualquer conta de inventário público. Agora mostrando{" "}
                  <b>{proprio ? steamId : `o inventário ${steamId}`}</b>, com {anuncios.length} itens
                  {proprio ? ", lido agora" : ", lido da Steam em 20 de agosto de 2026"}.
                </p>
                {erro ? <p className={limite ? "aviso" : "erro"}>{erro}</p> : null}
              </form>
              {carregando ? (
                <div className="barra">
                  <i />
                </div>
              ) : null}
            </div>
            {destaque ? (
              <aside className="vitrola">
                <p className="rotulo">menor desgaste do inventário</p>
                <Cartao a={destaque} atraso={80} destaque />
              </aside>
            ) : null}
          </div>
        </section>

        <div className="envolve">
          <div className="placar">
            <div>
              <b>{anuncios.length}</b>
              <span>itens lidos</span>
            </div>
            <div>
              <b>{comDesgaste.length}</b>
              <span>com desgaste e padrão</span>
            </div>
            <div>
              <b>{anuncios.length - travadas}</b>
              <span>podem sair hoje</span>
            </div>
            <div>
              <b>{travadas}</b>
              <span>travadas pela Steam</span>
            </div>
          </div>

          <h2 className="secao">Anúncios montados a partir do inventário</h2>
          <p className="abre">
            O desgaste e o padrão vêm da própria Steam, item por item. É esse número que separa uma peça de
            R$ 300 de uma de R$ 3.000 com o mesmo nome.
          </p>

          <div className="filtros">
            {[
              { chave: "tudo", texto: "todos" },
              { chave: "hoje", texto: "podem sair hoje" },
              { chave: "travadas", texto: "travadas" },
            ].map((f) => (
              <button
                key={f.chave}
                type="button"
                className={filtro === f.chave ? "ativo" : ""}
                onClick={() => setFiltro(f.chave as "tudo" | "hoje" | "travadas")}
              >
                {f.texto}
              </button>
            ))}
          </div>

          <div className="grade">
            {lista.map((a, i) => (
              <Cartao key={a.assetId} a={a} atraso={Math.min(i, 14) * 45} />
            ))}
          </div>

          {parAnalise ? (
            <section className="comparativo">
              <h2 className="secao">Por que o anúncio precisa ser por item</h2>
              <p className="abre">
                As duas peças abaixo saíram do mesmo inventário. Num catálogo por produto elas seriam a mesma
                linha, com o mesmo preço.
              </p>
              <div className="par">
                <div className="lado forte">
                  <h3>
                    {parAnalise.melhor.arma} {parAnalise.melhor.skin}
                  </h3>
                  <p>o menor desgaste do inventário</p>
                  <div className="linhas">
                    <div>
                      <span>desgaste</span>
                      <b>{parAnalise.melhor.desgaste?.toFixed(4).replace(".", ",")}</b>
                    </div>
                    <div>
                      <span>padrão</span>
                      <b>{parAnalise.melhor.padrao ?? "-"}</b>
                    </div>
                  </div>
                </div>
                <div className="lado">
                  <h3>
                    {parAnalise.pior.arma} {parAnalise.pior.skin}
                  </h3>
                  <p>o maior desgaste do inventário</p>
                  <div className="linhas">
                    <div>
                      <span>desgaste</span>
                      <b>{parAnalise.pior.desgaste?.toFixed(4).replace(".", ",")}</b>
                    </div>
                    <div>
                      <span>padrão</span>
                      <b>{parAnalise.pior.padrao ?? "-"}</b>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="remate">
          <div className="envolve">
            <p>
              Os valores em reais nesta página são exemplos, gerados só para mostrar o layout do anúncio. Não
              são cotação de mercado.
            </p>
            <p>
              O desgaste, o padrão, a imagem e o estado de troca de cada item são lidos do inventário público
              da Steam no momento em que a página é aberta.
            </p>
            <p className="ano">Vitrine, 2026</p>
          </div>
        </footer>
      </main>
    </>
  );
}
