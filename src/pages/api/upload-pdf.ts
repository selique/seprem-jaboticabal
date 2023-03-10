import extractPdfData from '@libs/extractPdfData';
import uploadToCloudinary from '@libs/uploadToCloudinary';
import cloudinary from 'cloudinary';
import multer, { MulterError } from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({ storage }).array('pdf');

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  upload(req, res, async (err: MulterError) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error uploading files');
      return;
    }
    try {
      const uploadedFiles = req.files as Express.Multer.File[];

      const results = await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            if (!file.buffer) {
              return {
                fileName: file.originalname,
                error: 'File buffer not found',
              };
            }

            const pdfData = file.buffer;
            const pdfDoc = await PDFDocument.load(pdfData);
            const pageBuffers: Buffer[] = [];

            await Promise.all(
              pdfDoc.getPages().map(async (_, index) => {
                const newDocument = await PDFDocument.create();
                const [copiedPage] = await newDocument.copyPages(pdfDoc, [index]);
                newDocument.addPage(copiedPage);
                const pageBuffer = await newDocument.save();
                pageBuffers.push(pageBuffer);
              })
            );

            let uploadedPages = 0;
            const cloudinaryFolder = 'pdf-uploads';
            await Promise.all(
              pageBuffers.map(async (pageBuffer) => {
                const extractedData = await extractPdfData(pageBuffer);

                if (extractedData[0]) {
                  const { cpf, year, month, name, enrollment } = extractedData[0];
                  const pageFileName = `${cpf}-${name}-${enrollment}-${month}-${year}.pdf`;

                  const fileExists = await cloudinary.search
                    .expression(`folder:${cloudinaryFolder}/${cpf}/${year}/${month} AND filename:${pageFileName}`)
                    .execute()
                    .then((result) => result.total_count > 0);

                  if (fileExists) {
                    console.log(`File ${pageFileName} already exists, skipping upload`);
                  } else {
                    const uploadResponse = await uploadToCloudinary(pageBuffer, pageFileName, `${cloudinaryFolder}/${cpf}/${year}/${month}`, (progress) => {
                      uploadedPages += 1;
                      const percentage = Math.round((uploadedPages / pageBuffers.length) * 100);
                      console.log(`Page ${uploadedPages} of ${pageBuffers.length} uploaded: ${percentage}%`);
                    });
                    console.log(`File ${pageFileName} uploaded successfully to ${uploadResponse.url}`);
                  }
                }
              })
            );

            return { fileName: file.originalname, numPages: pageBuffers.length };
          } catch (error) {
            console.error(error);
            return { fileName: file.originalname, error: error.message };
          }
        })
      );

      res.status(200).json({ results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
}


export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler