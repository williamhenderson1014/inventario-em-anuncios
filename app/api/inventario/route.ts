import { NextResponse } from "next/server";
import { montarAnuncios } from "@/lib/steam";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const steamId = (searchParams.get("steamid") || "").replace(/[^0-9]/g, "");

  if (steamId.length !== 17) {
    return NextResponse.json(
      { erro: "Um SteamID64 tem 17 números. Confira e tente de novo." },
      { status: 400 }
    );
  }

  const alvo = `https://steamcommunity.com/inventory/${steamId}/730/2?l=portuguese&count=60`;
  async function tentar(): Promise<Response> {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), 8000);
    try {
      return await fetch(alvo, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        cache: "no-store",
        signal: controle.signal,
      });
    } finally {
      clearTimeout(relogio);
    }
  }

  try {
    let resposta = await tentar();
    for (let volta = 0; volta < 2 && resposta.status === 429; volta++) {
      await new Promise((r) => setTimeout(r, 800));
      resposta = await tentar();
    }

    if (resposta.status === 403) {
      return NextResponse.json(
        { erro: "Esse inventário está privado. Na Steam, em privacidade, deixe o inventário público." },
        { status: 200 }
      );
    }
    if (resposta.status === 429) {
      return NextResponse.json(
        {
          erro:
            "A Steam limitou a consulta vinda deste servidor. É o comportamento normal dela com IP de datacenter, e num sistema em produção isso se resolve com fila e cache por conta, que é o serviço de sincronia do desenho. O inventário abaixo continua sendo real, lido da Steam em 20 de agosto de 2026.",
          upstream: 429,
        },
        { status: 200 }
      );
    }
    if (!resposta.ok) {
      return NextResponse.json(
        { erro: "A Steam não respondeu como esperado agora. Tente de novo em alguns segundos.", upstream: resposta.status },
        { status: 200 }
      );
    }

    const bruto = await resposta.json();
    const anuncios = montarAnuncios(bruto);
    if (anuncios.length === 0) {
      return NextResponse.json({ erro: "Não encontrei itens de CS2 nesse inventário." }, { status: 200 });
    }
    return NextResponse.json({ anuncios, steamId });
  } catch {
    return NextResponse.json(
      { erro: "A consulta demorou demais e foi cortada. Tente de novo." },
      { status: 200 }
    );
  }
}
