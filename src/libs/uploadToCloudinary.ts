import { UploadApiResponse, v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


const uploadToCloudinary = async (pdfBuffer: Buffer, fileName: string, folderName: string) => {
  try {
    const base64String = pdfBuffer.toString('base64')
    const result: UploadApiResponse = await cloudinary.uploader.upload(`data:application/pdf;base64,${base64String}`, {
      folder: folderName,
      public_id: fileName,
      resource_type: 'auto'
    })

    return result.secure_url
  } catch (error) {
    console.error(`Error uploading file to Cloudinary: ${error}`);
    console.error(error);
    throw new Error('Error uploading file to Cloudinary');
  }
}

export default uploadToCloudinary
