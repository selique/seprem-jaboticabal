import extractPdfData from '@/libs/extractPdfData'
import uploadToCloudinary from '@/libs/uploadToCloudinary'
import fsExtra, { mkdir } from 'fs-extra'
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
                pageBase64Strings.map(async (pageBase64String) => {
                  const pageBuffer = Buffer.from(pageBase64String, 'base64')
                  const extractedData = await extractPdfData(pageBuffer)
                  
                  if (extractedData) {
                    extractedData.map(async (data) => {
                      const pageFileName = extractedData.map((data) => `${data.cpf}_${data.name}_${data.enrollment}_${data.month}_${data.year}.pdf`).toString()
                      if (data.cpf && data.name && data.enrollment && data.month && data.year) {
                        // verify if folder exists
                        if (!fsExtra.existsSync(path.join(process.cwd(), 'public', 'uploads', `${data.year}`))){
                          mkdir(path.join(process.cwd(), 'public', 'uploads', `${data.year}`))
                      }  
                          const pageFolderPath = path.join(
                            process.cwd(),
                            'public',
                            'uploads',
                            `${data.year}`
                          )
                          uploadToCloudinary(pageBuffer, pageFileName, pageFolderPath)
                          await fsExtra.writeFile(
                            path.join(pageFolderPath, pageFileName),
                            pageBuffer
                          )
                        
                      } else {
                        if (!fsExtra.existsSync(path.join(process.cwd(), 'public', 'uploads', `${data.year}_with-errors`))){
                          mkdir(path.join(process.cwd(), 'public', 'uploads', `${data.year}_with-errors`))
                        }

                        const pageFolderPath = path.join(
                          process.cwd(),
                          'public',
                          'uploads',
                          `${data.year}_with-errors`
                        )
                        await fsExtra.writeFile(
                          path.join(pageFolderPath, pageFileName),
                          pageBuffer
                        )
                      }
                      
                       // Remove uploaded file from server
                       await fsExtra.remove(file.path)
                    }
                    )
                  }
                })
              )

              return pageBase64Strings
            }

            // split PDF upload by page and save to public/uploads folder
            const pageBuffers = await splitPdfIntoPages(pdfBuffer)

            return { pageBuffers }
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
