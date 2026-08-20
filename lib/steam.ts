import amostra from "./amostra.json";

export type Anuncio = {
  assetId: string;
  arma: string;
  skin: string;
  exterior: string | null;
  raridade: string | null;
  categoria: string;
  imagem: string;
  negociavel: boolean;
  desgaste: number | null;
  padrao: number | null;
  preco: number;
};

type Descricao = {
  classid: string;
  market_hash_name?: string;
  name?: string;
  type?: string;
  icon_url?: string;
  tradable?: number;
  tags?: { category?: string; localized_tag_name?: string }[];
};

type Propriedade = {
  assetid: string;
  asset_properties?: { propertyid: number; int_value?: string; float_value?: string }[];
};

type Payload = {
  assets?: { assetid: string; classid: string }[];
  descriptions?: Descricao[];
  asset_properties?: Propriedade[];
};

const CDN = "https://community.cloudflare.steamstatic.com/economy/image/";

function tag(d: Descricao, categoria: string): string | null {
  const t = (d.tags || []).find((x) => x.category === categoria);
  return t?.localized_tag_name ?? null;
}

const FAIXA_POR_RARIDADE: Record<string, [number, number]> = {
  "Padrão Doméstico": [3, 18],
  "Grau Industrial": [6, 40],
  "Nível Militar": [15, 130],
  Restrito: [60, 450],
  Secreto: [240, 1600],
  Oculto: [900, 5200],
  Extraordinário: [1800, 9000],
  "Qualidade Básica": [2, 14],
  "Alta Qualidade": [5, 30],
  Notável: [8, 60],
};

function precoExemplo(assetId: string, desgaste: number | null, raridade: string | null): number {
  let h = 0;
  for (let i = 0; i < assetId.length; i++) h = (h * 31 + assetId.charCodeAt(i)) % 1000003;
  const [minimo, maximo] = FAIXA_POR_RARIDADE[raridade || ""] || [10, 90];
  const dentro = minimo + (h % 1000) / 1000 * (maximo - minimo);
  const peso = desgaste === null ? 1 : 0.78 + (1 - Math.min(desgaste, 1)) * 0.44;
  const bruto = dentro * peso;
  const arredonda = bruto > 1000 ? 10 : bruto > 100 ? 5 : 1;
  return Math.max(minimo, Math.round(bruto / arredonda) * arredonda);
}

export function montarAnuncios(bruto: unknown): Anuncio[] {
  const dados = bruto as Payload;
  const porClasse = new Map<string, Descricao>();
  for (const d of dados.descriptions || []) porClasse.set(String(d.classid), d);

  const props = new Map<string, { desgaste: number | null; padrao: number | null }>();
  for (const p of dados.asset_properties || []) {
    let desgaste: number | null = null;
    let padrao: number | null = null;
    for (const q of p.asset_properties || []) {
      if (q.propertyid === 2 && q.float_value) desgaste = Number(q.float_value);
      if (q.propertyid === 1 && q.int_value) padrao = Number(q.int_value);
    }
    props.set(String(p.assetid), { desgaste, padrao });
  }

  const lista: Anuncio[] = [];
  for (const a of dados.assets || []) {
    const d = porClasse.get(String(a.classid));
    if (!d) continue;
    const nome = d.market_hash_name || d.name || "";
    const partes = nome.split(" | ");
    const arma = partes[0] || nome;
    const skin = (partes[1] || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
    const extra = props.get(String(a.assetid));
    const desgaste = extra?.desgaste ?? null;
    lista.push({
      assetId: String(a.assetid),
      arma,
      skin,
      exterior: tag(d, "Exterior"),
      raridade: tag(d, "Rarity"),
      categoria: tag(d, "Type") || (d.type || "").split(" ")[0],
      imagem: d.icon_url ? CDN + d.icon_url + "/330x192" : "",
      negociavel: d.tradable !== 0,
      desgaste,
      padrao: extra?.padrao ?? null,
      preco: precoExemplo(String(a.assetid), desgaste, tag(d, "Rarity")),
    });
  }

  lista.sort((x, y) => {
    if (x.desgaste === null && y.desgaste === null) return 0;
    if (x.desgaste === null) return 1;
    if (y.desgaste === null) return -1;
    return x.desgaste - y.desgaste;
  });
  return lista;
}

export function anunciosDeAmostra(): Anuncio[] {
  return montarAnuncios(amostra);
}

export const STEAM_ID_EXEMPLO = "76561198084749846";
