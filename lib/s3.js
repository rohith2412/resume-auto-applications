import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const BUCKET     = process.env.S3_BUCKET || 'reblet-uploads'
const PUBLIC_URL = process.env.S3_PUBLIC_URL

function getClient() {
  return new S3Client({
    region:      process.env.S3_REGION || 'auto',
    endpoint:    process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId:     process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  })
}

export async function uploadFile(key, body, contentType) {
  await getClient().send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }))
  return `${PUBLIC_URL}/${key}`
}

export async function deleteFile(key) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key:    key,
  }))
}
