import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import type { Product } from "../shared/schema";

function clean(markdown: string) {
  return markdown.replace(/\r/g, "").replace(/```/g, "");
}

export function createPdf(product: Product): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(22).fillColor("#061A2E").text(product.title, { lineGap: 6 });
    doc.moveDown();
    doc.fontSize(10).fillColor("#2F8CFF").text(`Prompt For Profit | ${product.productType} | ${product.status}`);
    doc.moveDown();
    clean(product.content)
      .split("\n")
      .forEach((line) => {
        if (line.startsWith("# ")) doc.moveDown().fontSize(18).fillColor("#061A2E").text(line.replace("# ", ""));
        else if (line.startsWith("## ")) doc.moveDown().fontSize(14).fillColor("#0B3156").text(line.replace("## ", ""));
        else doc.fontSize(10.5).fillColor("#1F2A37").text(line || " ", { lineGap: 3 });
      });
    doc.end();
  });
}

export async function createDocx(product: Product) {
  const children = clean(product.content)
    .split("\n")
    .map((line) => {
      const isTitle = line.startsWith("# ");
      const isHeading = line.startsWith("## ");
      const text = line.replace(/^#{1,2}\s*/, "");
      return new Paragraph({
        spacing: { after: isTitle || isHeading ? 180 : 90 },
        children: [
          new TextRun({
            text: text || " ",
            bold: isTitle || isHeading,
            size: isTitle ? 34 : isHeading ? 26 : 22,
            color: isTitle || isHeading ? "061A2E" : "111827"
          })
        ]
      });
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: product.title, bold: true, size: 38, color: "061A2E" })],
            spacing: { after: 240 }
          }),
          ...children
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}
