import { v2 as cloudinary } from 'cloudinary'
import { PassThrough } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = (
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough()
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }
    )

    let uploadedBytes = 0
    let totalBytes = buffer.byteLength

    passThrough.on('data', (chunk: Buffer) => {
      uploadedBytes += chunk.length
      const progress = (uploadedBytes / totalBytes) * 100
      console.log(`Uploading ${fileName} - ${progress.toFixed(2)}% completed`)
    })

    passThrough.on('error', (error: Error) => {
      reject(error)
    })

    passThrough.on('end', () => {
      console.log(`Uploading ${fileName} - 100% completed`)
    })

    passThrough.pipe(uploadStream)
    passThrough.write(buffer)
    passThrough.end()
  })
}

export default uploadToCloudinary
