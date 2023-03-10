import pdf from 'pdf-extraction';

const extractCpf = (item: string): string | null => {
  const regex = /CPF[\n\s]*(\d{3}\.\d{3}\.\d{3}\-\d{2})/;
  const match = item.match(regex)?.[1];
  if(match) {
    return match;
  } else {
    const regex = /\d{3}\.\d{3}\.\d{3}\-\d{2}/;
    const match = item.match(regex);
    const cpf = match ? match[0] : null;
    return cpf;
  }
};

const extractName = (item: string): string | null => {
  const regex = /\d{5}[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ0-9'.\s]+MatrículaNome/;
  const match = item.match(regex);

  if (match) {
    const name = match[0].replace(/^\d{5}/, '').replace(/MatrículaNome/, '').trim();

    return name;
    
  } else {
    const regex1 = /Nome\s+(.+)\s+\d{3}\.\d{3}\.\d{3}\-\d{2}/;
    const match1 = item.match(regex1);
    const name1 = match1 ? match1[1] : null;
    
    const regex2 = /Nome\s+(.+)\s+\d{2}\/\d{2}\/\d{4}/;
    const match2 = item.match(regex2);
    const name2 = match2 ? match2[1] : null;
    
    return name1 ?? name2 ?? null;
  }
};

const extractEnrollment = (item: string): number | null => {
  const regex = /(\d{5})[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ0-9'.\s]+MatrículaNome/;
  const match = item.match(regex);

  if (match) {
    return +match[1];
  } else {
    const regex = /Matrícula\s+(\d{5})/;
    const match = item.match(regex);
    return match ? match[1] : null;
  }

};
const extractMonth = (item: string): number | null => {
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

  const regex = /Mensal([A-Za-z]+) de (\d{4})|(\w+)\s+de\s+(\d{4})Mensal/i;
  const match = item.match(regex);
  if (!match) return null;
  const monthName = match[1] || match[3];
  const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  return monthIndex !== -1 ? monthIndex + 1 : null;
}; 

const extractYear = (item: string): number | null => {
  const regex = /(?:\bde\s+)(\d{4})/;
  const match = item.match(regex);
  return match ? +match[1] : null;
};

const extractPdfData = async (
  pdfBuffer: Buffer
): Promise<
  Array<{
    cpf: string | null;
    name: string | null;
    enrollment: number | null;
    month: number | null;
    year: number | null;
  }>
> => {
  const data = await pdf(pdfBuffer);

  const page = data.text
  console.log(page)
  const extractedData = [];
  console.log(extractMonth(page) === 12)
  console.log(extractYear(page) === 2022)

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