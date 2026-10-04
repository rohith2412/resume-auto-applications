import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region:      process.env.S3_REGION || 'auto',
  endpoint:    process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

const BUCKET     = process.env.S3_BUCKET || 'reblet-uploads'
const PUBLIC_URL = process.env.S3_PUBLIC_URL

export async function uploadFile(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }))
  return `${PUBLIC_URL}/${key}`
}

export async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key:    key,
  }))
}
