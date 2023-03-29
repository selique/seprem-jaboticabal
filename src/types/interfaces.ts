export interface PdfUploadInput {
  cpf: string
  fileName: string
  fileType: 'HOLERITE' | 'DEMOSTRATIVO_ANUAL'
  year: number
  month: number | null
  file?: File
}

export interface UploadResult {
  cpf: string
  name: string
  enrollment: number
  year: number
  month: number | null
  pdf: {
    fileName: string
    fileType: string
    file: string
  }
}
;[]
