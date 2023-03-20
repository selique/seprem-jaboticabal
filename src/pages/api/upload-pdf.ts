import extractPdfData from '@/libs/extractPdfData'
import multer from 'multer'
import { PDFDocument } from 'pdf-lib'

export const config = {
  api: {
    bodyParser: false,
  },
}

const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50, // limit file size to 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Invalid file type. Only PDF files are allowed.'))
    } else {
      cb(null, true)
    }
  },
})

export default async function handler(req: any, res: any) {
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      console.error(`Error uploading file: ${err}`)
      return res.status(500).send('Error uploading file')
    }

    const pdfData = req.file?.buffer
    if (!pdfData) {
      return res.status(400).send('No file uploaded')
    }

    const pdfDoc = await PDFDocument.load(pdfData)
    const pageBuffers: Uint8Array[] = []

    try {
      await Promise.all(
        pdfDoc.getPages().map(async (_, index) => {
          const newDocument = await PDFDocument.create()
          const [copiedPage] = await newDocument.copyPages(pdfDoc, [index])
          newDocument.addPage(copiedPage)
          const pageBuffer = await newDocument.save()
          pageBuffers.push(pageBuffer)
        })
      )

      const arrayResponseJson = [];

      for (const pageBuffer of pageBuffers) {
        try {
          const extractedData = await extractPdfData(pageBuffer as Buffer)
      
          if (extractedData[0]) {
            const { cpf, year, month, name, enrollment } = extractedData[0]
            if (!cpf || !name || !enrollment) {
              console.error('Invalid data extracted from PDF')
              return res.status(400).send('Invalid input')
            }
      
            const pageFileName = `${cpf}-${name}-${enrollment}-${month}-${year}.pdf`
                  
            if (!cpf) {
              console.error('CPF is null or undefined')
              return res.status(400).send('Invalid input')
            }
            const nameWithoutDash = name.replace(/-/g, ' ')
            const pdfObject = {
              name: nameWithoutDash,
              cpf,
              enrollment,
              year,
              month,
              pdf: {
                fileName: pageFileName,
                file: Buffer.from(pageBuffer).toString('base64')
              },
            };
            arrayResponseJson.push(pdfObject);
          }
        } catch (error) {
          console.error(`Error processing PDF: ${error}`);
          return res.status(500).send(`Error processing PDF: ${error}`);
        }
      }

      // return in json format the array of objects
      return res.status(200).json(arrayResponseJson)
    } catch (error) {
      console.error(`Error processing PDF: ${error}`)
      return res.status(500).send('Error processing PDF')
    }
  })
}
