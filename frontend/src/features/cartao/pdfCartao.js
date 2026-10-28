import { toJpeg } from "html-to-image";

// PDF do cartão de visita pra imprimir (28/10/2026), sempre em A4 com o cartão no tamanho
// real de 9 × 5 cm. "folha" = frente e verso um embaixo do outro, com marcas de corte;
// "tres" = 3 pares frente|verso lado a lado, pra recortar o contorno, dobrar no meio e colar.
export async function gerarPdfCartao({ frenteEl, versoEl, tipo, nome, arquivo }) {
  // JPEG (não PNG): em PNG o PDF passava de 20 MB. 1620 px pra 9 cm dá ~450 dpi.
  const opcoes = { pixelRatio: 3, quality: 0.92, backgroundColor: "#ffffff", cacheBust: true };
  const { jsPDF } = await import("jspdf");
  const frente = await toJpeg(frenteEl, opcoes);
  const verso = await toJpeg(versoEl, opcoes);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = 90;
  const A = 50;

  function marcasDeCorte(x, y, w, h) {
    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([], 0);
    const t = 4;
    for (const [cx, cy, dx, dy] of [
      [x, y, -1, -1],
      [x + w, y, 1, -1],
      [x, y + h, -1, 1],
      [x + w, y + h, 1, 1],
    ]) {
      doc.line(cx + dx, cy, cx + dx * (t + 1), cy);
      doc.line(cx, cy + dy, cx, cy + dy * (t + 1));
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(59, 40, 28);
  doc.text(`Cartão de visita: ${nome || ""}`, 105, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Imprima em tamanho real (100%, sem ajustar à página). Cada cartão tem 9 × 5 cm.", 105, 25, {
    align: "center",
  });

  if (tipo === "folha") {
    const x = (210 - L) / 2;
    for (const [img, rotulo, y] of [
      [frente, "Frente", 45],
      [verso, "Verso", 120],
    ]) {
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(rotulo, x, y - 4);
      doc.addImage(img, "JPEG", x, y, L, A, rotulo);
      marcasDeCorte(x, y, L, A);
    }
    doc.setFontSize(9);
    doc.text("Recorte nas marcas e cole a frente no verso, ou imprima frente e verso na gráfica.", 105, 190, {
      align: "center",
    });
  } else {
    const x = (210 - 2 * L) / 2;
    doc.setFontSize(9);
    doc.text("Recorte o contorno de cada cartão, dobre na linha do meio (frente pra fora) e cole.", 105, 30, {
      align: "center",
    });
    for (const y of [42, 112, 182]) {
      doc.addImage(frente, "JPEG", x, y, L, A, "frente");
      doc.addImage(verso, "JPEG", x + L, y, L, A, "verso");
      marcasDeCorte(x, y, 2 * L, A);
      doc.setDrawColor(150);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(x + L, y - 5, x + L, y);
      doc.line(x + L, y + A, x + L, y + A + 5);
      doc.setLineDashPattern([], 0);
    }
  }

  doc.save(arquivo);
}
