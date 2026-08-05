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
};

const CREME: [number, number, number] = [252, 248, 240];
const TINTA: [number, number, number] = [28, 24, 20];
const AMBAR: [number, number, number] = [150, 96, 20];
const SUAVE: [number, number, number] = [104, 92, 78];

/**
 * Gera a carta de drinks em PDF (A4 retrato) com um QR Code por receita.
 * Executa apenas no navegador — jsPDF e qrcode são importados dinamicamente.
 */
export async function gerarCartaPdf({ titulo, subtitulo, drinks, baseUrl }: CartaOptions) {
  const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 18;

  // Fundo
  doc.setFillColor(...CREME);
  doc.rect(0, 0, W, H, "F");

  // Moldura dupla
  doc.setDrawColor(...AMBAR);
  doc.setLineWidth(0.8);
  doc.rect(M - 6, M - 6, W - (M - 6) * 2, H - (M - 6) * 2);
  doc.setLineWidth(0.2);
  doc.rect(M - 4, M - 4, W - (M - 4) * 2, H - (M - 4) * 2);

  // Cabeçalho
  doc.setTextColor(...AMBAR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("C A R T A   D E   D R I N K S", W / 2, M + 6, { align: "center" });

  doc.setTextColor(...TINTA);
  doc.setFont("times", "normal");
  doc.setFontSize(28);
  const tituloLinhas = doc.splitTextToSize(titulo || "Nossa Carta", W - M * 2);
  doc.text(tituloLinhas, W / 2, M + 20, { align: "center" });

  let y = M + 20 + tituloLinhas.length * 10;

  if (subtitulo?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SUAVE);
    const sub = doc.splitTextToSize(subtitulo.trim(), W - M * 2);
    doc.text(sub, W / 2, y, { align: "center" });
    y += sub.length * 5;
  }

  y += 4;
  doc.setDrawColor(...AMBAR);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 18, y, W / 2 + 18, y);
  y += 10;

  const qrSize = 22;
  const alturaBloco = (H - M - 26 - y) / Math.max(drinks.length, 1);

  for (const [i, d] of drinks.entries()) {
    const topo = y + i * alturaBloco;
    const textoLargura = W - M * 2 - qrSize - 8;

    // QR Code da receita
    const url = `${baseUrl}/drinks/${d.id}`;
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 0,
      width: 400,
      color: { dark: "#1c1814", light: "#fcf8f0" },
    });
    doc.addImage(dataUrl, "PNG", W - M - qrSize, topo, qrSize, qrSize);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...SUAVE);
    doc.text("escaneie", W - M - qrSize / 2, topo + qrSize + 3, { align: "center" });

    // Nome
    doc.setFont("times", "normal");
    doc.setFontSize(17);
    doc.setTextColor(...TINTA);
    const nomeLinhas = doc.splitTextToSize(d.nome, textoLargura);
    doc.text(nomeLinhas, M, topo + 6);
    let ty = topo + 6 + nomeLinhas.length * 6.5;

    // Dificuldade
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...AMBAR);
    doc.text(d.dificuldade.toUpperCase(), M, ty);
    ty += 5;

    // Ingredientes
    doc.setFontSize(9.5);
    doc.setTextColor(...SUAVE);
    const ing = doc.splitTextToSize(d.ingredientes.join(" · ") || "—", textoLargura);
    doc.text(ing.slice(0, 3), M, ty);

    // Separador
    if (i < drinks.length - 1) {
      doc.setDrawColor(214, 202, 184);
      doc.setLineWidth(0.2);
      doc.line(M, topo + alturaBloco - 4, W - M, topo + alturaBloco - 4);
    }
  }

  // Rodapé
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SUAVE);
  doc.text(
    "Aponte a câmera do celular para o QR Code e veja a receita completa.",
    W / 2,
    H - M - 6,
    { align: "center" },
  );
  doc.setTextColor(...AMBAR);
  doc.setFontSize(7.5);
  doc.text("Aprecie com moderação. Venda proibida para menores de 18 anos.", W / 2, H - M, {
    align: "center",
  });

  const nomeArquivo = `carta-${(titulo || "drinks")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.pdf`;

  doc.save(nomeArquivo);
}
