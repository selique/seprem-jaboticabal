import pdf from 'pdf-extraction';

const extractCpf = (item: string): string | null => {
  const cpf = item.match(/CPF[\n\s]*(\d{3}\.\d{3}\.\d{3}\-\d{2})/)?.[1] ?? null;
  return cpf;
};

const extractName = (item: string): string | null => {
  const regex = /\d{5}[A-Za-z0-9\s]+MatrículaNome/;
  const match = item.match(regex);

  if (!match) return null;

  const name = match[0].replace(/^\d{5}/, '').replace(/MatrículaNome/, '').trim();

  return name || null;
};

const extractEnrollment = (item: string): number | null => {
  const regex = /(\d{5})[A-Za-z0-9\s]+MatrículaNome/;
  const match = item.match(regex);

  if (!match) return null;

  return +match[1];
};

const extractMonth = (item: string): string | null => {
  const regex = /Mensal([A-Za-z]+) de (\d{4})/;
  const match = item.match(regex);

  if (!match) return null;

  const [, month] = match;
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  const monthIndex = months.findIndex(m => m.toLowerCase() === month.toLowerCase());

  return monthIndex !== -1 ? `${(monthIndex + 1).toString().padStart(2, '0')}` : null;
};

const extractYear = (item: string): number | null => {
  const yearMatch = item.match(/Mensal[A-Za-z]+\s+de\s+(\d{4})/i);

  return yearMatch ? +yearMatch[1] : null;
};

const extractPdfData = async (
  pdfBuffer: Buffer
): Promise<
  Array<{
    cpf: string | null;
    name: string | null;
    enrollment: number | null;
    month: string | null;
    year: number | null;
  }>
> => {
  const data = await pdf(pdfBuffer);

  const page = data.text
  const extractedData = [];
  extractedData.push({
    cpf: extractCpf(page),
    name: extractName(page),
    enrollment: extractEnrollment(page),
    month: extractMonth(page),
    year: extractYear(page),
  });
  return extractedData;
};

export default extractPdfData;
