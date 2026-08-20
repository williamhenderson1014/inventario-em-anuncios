import { NextResponse } from "next/server";
import { montarAnuncios } from "@/lib/steam";

export const dynamic = "force-dynamic";

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
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), 9000);

  try {
    const resposta = await fetch(alvo, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controle.signal,
    });
    clearTimeout(relogio);

    if (resposta.status === 403) {
      return NextResponse.json(
        { erro: "Esse inventário está privado. Na Steam, em privacidade, deixe o inventário público." },
        { status: 200 }
      );
    }
    if (!resposta.ok) {
      return NextResponse.json(
        { erro: "A Steam recusou a consulta agora. Costuma ser limite de requisição, tente de novo em alguns segundos." },
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
    clearTimeout(relogio);
    return NextResponse.json(
      { erro: "A consulta demorou demais e foi cortada. Tente de novo." },
      { status: 200 }
    );
  }
}
