import Vitrine from "./vitrine";
import { anunciosDeAmostra, STEAM_ID_EXEMPLO } from "@/lib/steam";

export default function Pagina() {
  return <Vitrine iniciais={anunciosDeAmostra()} steamIdInicial={STEAM_ID_EXEMPLO} />;
}
