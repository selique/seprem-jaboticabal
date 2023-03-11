import pdf from 'pdf-extraction'

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
]

const titleCase = (str: string): string =>
  str
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    )
    .trim()

const extractCpf = (item: string): string | null => {
  const extract = item.match(/\d{3}.\d{3}.\d{3}-\d{2}/)
  return extract ? extract[0] : null
}

const extractName = (item: string): string | null => {
  const extract = item.match(/[^\d]+Matrícula/)
  return extract ? titleCase(extract[0].replace('Matrícula', '')) : null
}

const extractEnrollment = (item: string): number | null => {
  const extract = item.match(/\d+[^\d]+Matrícula/)
  return extract ? +extract[0].replace(/[^\d]/g, '') : null
}

const extractMonth = (item: string): number | null => {
  const extract = item.match(/[^\d]+ de 20\d+/)
  return extract
    ? months.indexOf(
        extract[0]
          .replace('Mensal', '')
          .replace(/de \d+/, '')
          .trim()
          .toLowerCase()
      )
    : null
}

const extractYear = (item: string): number | null => {
  const extract = item.match(/(?:\bde\s+)(\d{4})/)
  return extract ? +extract[1] : null
}

const extractPdfData = async (
  pdfBuffer: Buffer
): Promise<
  Array<{
    cpf: string | null
    name: string | null
    enrollment: number | null
    month: number | null
    year: number | null
  }>
> => {
  const data = await pdf(pdfBuffer)

  const page = data.text.replace(/\n/g, '')
  const extractedData = []

  extractedData.push({
    cpf: extractCpf(page),
    name: extractName(page),
    enrollment: extractEnrollment(page),
    month: extractMonth(page),
    year: extractYear(page),
  })

  return extractedData
}

export default extractPdfData
