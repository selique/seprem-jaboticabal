import extractPdfData from '@/libs/extractPdfData'
import fsExtra from 'fs-extra'
import multer, { MulterError } from 'multer'
import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { v4 as uuidv4 } from 'uuid'

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'public', 'uploads'),
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uuidv4()}-${uniqueSuffix}`)
  },
})

const upload = multer({ storage }).array('pdf')

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  upload(req, res, async (err: MulterError) => {
    if (err) {
      console.error(err)
      res.status(500).send('Error uploading files')
      return
    }

    try {
      // Get uploaded files
      const uploadedFiles = req.files as Express.Multer.File[]

      // Extract data from each PDF file and upload to Cloudinary
      const results = await Promise.all(
        uploadedFiles.map(async (file: Express.Multer.File) => {
          try {
            if (!file.path) {
              return {
                fileName: file.originalname,
                error: 'File path not found',
              }
            }

            // Read PDF file
            const pdfBuffer = await fsExtra.readFile(file.path)

            const splitPdfIntoPages = async (
              pdfBuffer: Buffer
            ): Promise<string[]> => {
              const pdfDoc = await PDFDocument.load(pdfBuffer)
              const pageBase64Strings: string[] = []

              await Promise.all(
                pdfDoc.getPages().map(async (_, index) => {
                  const newDocument = await PDFDocument.create()
                  const [copiedPage] = await newDocument.copyPages(pdfDoc, [
                    index,
                  ])
                  newDocument.addPage(copiedPage)
                  pageBase64Strings.push(await newDocument.saveAsBase64())
                })
              )

              await Promise.all(
                pageBase64Strings.map(async (pageBase64String, index) => {
                  const pageBuffer = Buffer.from(pageBase64String, 'base64')
                  const pageFileName = `${index + 1}_${uuidv4()}.pdf`
                  const pageFolderPath = path.join(
                    process.cwd(),
                    'public',
                    'uploads'
                  )
                  await fsExtra.writeFile(
                    path.join(pageFolderPath, pageFileName),
                    pageBuffer
                  )
                })
              )

              return pageBase64Strings
            }

            // split PDF upload by page and save to public/uploads folder
            const pageBuffers = await splitPdfIntoPages(pdfBuffer)

            // Search for PDF files in public/uploads folder, extract data, and rename file to include data extracted
            const uploadFolderPath = path.join(
              process.cwd(),
              'public',
              'uploads'
            )
            const files = await fsExtra.readdir(uploadFolderPath)
            await Promise.all(
              files.map(async (fileName) => {
                try {
                  if (fileName.endsWith('.pdf')) {
                    const filePath = path.join(uploadFolderPath, fileName)

                    // Extract data from page using extractPdfData()
                    const extractedData = await extractPdfData(filePath)
                    console.log(extractedData)

                    // Rename file to include extracted data
                    const newFileName = `
                    ${extractedData.cpf}_
                    ${extractedData.name}_
                    ${extractedData.enrollment}_
                    ${extractedData.month}_
                    ${extractedData.year}_
                    .pdf`
                    // Create new file path
                    const newFilePath = path.join(uploadFolderPath, newFileName)
                    // Rename file in public/uploads folder
                    await fsExtra.rename(filePath, newFilePath)
                    // Delete file from public/uploads folder
                    await fsExtra.remove(filePath)
                  }

                } catch (error) {
                  console.error(error)
                }
              })
            )
            

            return { fileName: file.originalname, pageBuffers }
          } catch (error) {
            console.error(error)
            return { fileName: file.originalname, error: error.message }
          }
        })
      )

      res.status(200).json({ results })
    } catch (error) {
      console.error(error)
      res.status(500).send('Error processing files')
    }
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler
