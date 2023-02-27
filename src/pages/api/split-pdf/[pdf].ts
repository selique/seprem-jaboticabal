import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';
import pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

async function extractTextFromPdf(filePath: string): Promise<string[]> {
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
  const pageTexts: string[] = [];

  for (const pageNumber of pages) {
    const page = await pdfDoc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => (item as TextItem).str).join('');
    pageTexts.push(text);
  }

  return pageTexts;
}

async function splitPdf(filePath: string): Promise<void> {
  const pageTexts = await extractTextFromPdf(filePath);
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (let i = 0; i < pageTexts.length; i++) {
    const text = pageTexts[i];
    const cpfMatch = text.match(/CPF:\s*(\d{3}\.\d{3}\.\d{3}-\d{2})/i);
    const nomeMatch = text.match(/nome:\s*([^\n]+)/i);

    if (cpfMatch && nomeMatch) {
      const cpf = cpfMatch[1].replace(/\D/g, '');
      const nome = nomeMatch[1].trim();
      const newPdfDoc = await PDFDocument.create();
      const [existingPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      await newPdfDoc.addPage(existingPage);
      const newPdfBytes = await newPdfDoc.save();
      const newFilePath = `${cpf}-${nome}-page${i + 1}.pdf`;
      fs.writeFileSync(newFilePath, newPdfBytes);
    } else {
      console.warn(`CPF and nome fields not found in page ${i + 1}`);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pdf } = req.query;

  if (typeof pdf !== 'string') {
    return res.status(400).send('Invalid input');
  }

  try {
    await splitPdf(pdf);
    return res.status(200).send('PDF file split into separate files');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}
