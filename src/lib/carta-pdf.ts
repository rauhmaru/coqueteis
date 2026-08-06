import { templatePorId, type CartaTemplate } from "@/lib/carta-templates";
import type { PorcaoIngrediente } from "@/lib/porcoes";

export type CartaDrink = {
  id: string;
  nome: string;
  dificuldade: string;
  ingredientes: string[];
};

export type CartaOptions = {
  titulo: string;
  subtitulo?: string;
  drinks: CartaDrink[];
  baseUrl: string;
  /** id do template visual */
  template?: string;
  /** tamanho do QR Code em mm */
  qrMm?: number;
  /** link público da carta — quando informado, cada QR aponta para a receita e o rodapé traz o link */
  linkPublico?: string;
  /** lista de compras opcional (segunda página) */
  compras?: {
    convidados: number;
    porPessoa: number;
    porcoesPorReceita: number;
    itens: PorcaoIngrediente[];
    volumeTotalMl: number;
  };
};

const hex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/**
 * Gera a carta de drinks em PDF (A4 retrato) com um QR Code por receita.
 * Executa apenas no navegador — jsPDF e qrcode são importados dinamicamente.
 */
export async function gerarCartaPdf({
  titulo,
  subtitulo,
  drinks,
  baseUrl,
  template,
  qrMm = 24,
  linkPublico,
  compras,
}: CartaOptions) {
  const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
  const t: CartaTemplate = templatePorId(template);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 18;

  const pintarFundo = () => {
    doc.setFillColor(...t.fundo);
    doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(...t.destaque);
    doc.setLineWidth(0.8);
    doc.rect(M - 6, M - 6, W - (M - 6) * 2, H - (M - 6) * 2);
    doc.setLineWidth(0.2);
    doc.rect(M - 4, M - 4, W - (M - 4) * 2, H - (M - 4) * 2);
  };

  pintarFundo();

  // Cabeçalho
  doc.setTextColor(...t.destaque);
  doc.setFont(t.fonteCorpo, "normal");
  doc.setFontSize(9);
  doc.text("C A R T A   D E   D R I N K S", W / 2, M + 6, { align: "center" });

  doc.setTextColor(...t.tinta);
  doc.setFont(t.fonteTitulo, "normal");
  doc.setFontSize(28);
  const tituloLinhas = doc.splitTextToSize(titulo || "Nossa Carta", W - M * 2);
  doc.text(tituloLinhas, W / 2, M + 20, { align: "center" });

  let y = M + 20 + tituloLinhas.length * 10;

  if (subtitulo?.trim()) {
    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...t.suave);
    const sub = doc.splitTextToSize(subtitulo.trim(), W - M * 2);
    doc.text(sub, W / 2, y, { align: "center" });
    y += sub.length * 5;
  }

  y += 4;
  doc.setDrawColor(...t.destaque);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 18, y, W / 2 + 18, y);
  y += 10;

  const qrSize = qrMm;
  const areaDisponivel = H - M - 26 - y;
  const alturaBloco = areaDisponivel / Math.max(drinks.length, 1);
  const inicio = y;

  for (const [i, d] of drinks.entries()) {
    const alturaConteudo = Math.max(qrSize + 4, 26);
    const topo = inicio + i * alturaBloco + Math.max((alturaBloco - alturaConteudo) / 2, 0);
    const textoLargura = W - M * 2 - qrSize - 8;

    // QR Code da receita
    const url = `${baseUrl}/drinks/${d.id}`;
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 0,
      width: 400,
      color: { dark: hex(t.tinta), light: hex(t.fundo) },
    });
    doc.addImage(dataUrl, "PNG", W - M - qrSize, topo, qrSize, qrSize);
    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(6);
    doc.setTextColor(...t.suave);
    doc.text("escaneie", W - M - qrSize / 2, topo + qrSize + 3, { align: "center" });

    // Nome
    doc.setFont(t.fonteTitulo, "normal");
    doc.setFontSize(17);
    doc.setTextColor(...t.tinta);
    const nomeLinhas = doc.splitTextToSize(d.nome, textoLargura);
    doc.text(nomeLinhas, M, topo + 6);
    let ty = topo + 6 + nomeLinhas.length * 6.5;

    // Dificuldade
    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...t.destaque);
    doc.text(d.dificuldade.toUpperCase(), M, ty);
    ty += 5;

    // Ingredientes
    doc.setFontSize(9.5);
    doc.setTextColor(...t.suave);
    const ing = doc.splitTextToSize(d.ingredientes.join(" · ") || "—", textoLargura);
    doc.text(ing.slice(0, 3), M, ty);

    if (i < drinks.length - 1) {
      const linhaY = inicio + (i + 1) * alturaBloco - 2;
      doc.setDrawColor(...t.linha);
      doc.setLineWidth(0.2);
      doc.line(M, linhaY, W - M, linhaY);
    }
  }

  // Rodapé
  if (linkPublico) {
    const mini = 16;
    const miniQr = await QRCode.toDataURL(linkPublico, {
      margin: 0,
      width: 300,
      color: { dark: hex(t.tinta), light: hex(t.fundo) },
    });
    doc.addImage(miniQr, "PNG", M, H - M - mini - 2, mini, mini);
    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...t.suave);
    doc.text("carta completa online", M + mini / 2, H - M + 1, { align: "center" });
  }
  doc.setFont(t.fonteCorpo, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...t.suave);
  doc.text("Aponte a câmera do celular para o QR Code e veja a receita completa.", W / 2, H - M - 6, {
    align: "center",
  });
  doc.setTextColor(...t.destaque);
  doc.setFontSize(7.5);
  doc.text("Aprecie com moderação. Venda proibida para menores de 18 anos.", W / 2, H - M - 1, {
    align: "center",
  });


  // Página 2 — lista de compras
  if (compras && compras.itens.length > 0) {
    doc.addPage();
    pintarFundo();

    doc.setTextColor(...t.destaque);
    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(9);
    doc.text("L I S T A   D E   C O M P R A S", W / 2, M + 6, { align: "center" });

    doc.setFont(t.fonteTitulo, "normal");
    doc.setFontSize(22);
    doc.setTextColor(...t.tinta);
    doc.text("Quanto comprar para a festa", W / 2, M + 18, { align: "center" });

    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(10);
    doc.setTextColor(...t.suave);
    doc.text(
      `${compras.convidados} convidados · ${compras.porPessoa} drink(s) por pessoa · ${
        compras.porcoesPorReceita * drinks.length
      } porções (${compras.porcoesPorReceita} de cada receita)`,
      W / 2,
      M + 26,
      { align: "center" },
    );

    let ly = M + 40;
    doc.setFontSize(8);
    doc.setTextColor(...t.destaque);
    doc.text("INGREDIENTE", M, ly);
    doc.text("TOTAL", W - M - 62, ly);
    doc.text("COMPRAR", W - M - 34, ly);
    ly += 3;
    doc.setDrawColor(...t.destaque);
    doc.setLineWidth(0.3);
    doc.line(M, ly, W - M, ly);
    ly += 6;

    doc.setFontSize(10);
    for (const item of compras.itens) {
      if (ly > H - M - 24) break;
      doc.setTextColor(...t.tinta);
      doc.text(doc.splitTextToSize(item.nome, W - M * 2 - 70)[0]!, M, ly);
      doc.setTextColor(...t.suave);
      doc.text(item.quantidade, W - M - 62, ly);
      doc.text(
        item.garrafas !== null ? `${item.garrafas} × ${item.embalagem}` : "a gosto",
        W - M - 34,
        ly,
      );
      doc.setDrawColor(...t.linha);
      doc.setLineWidth(0.1);
      doc.line(M, ly + 3, W - M, ly + 3);
      ly += 9;
    }


    doc.setFont(t.fonteCorpo, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...t.suave);
    doc.text(
      "Estimativas com base em medidas clássicas de coquetelaria e embalagens comerciais comuns.",
      W / 2,
      H - M,
      { align: "center" },
    );
  }

  const nomeArquivo = `carta-${(titulo || "drinks")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.pdf`;

  doc.save(nomeArquivo);
}
