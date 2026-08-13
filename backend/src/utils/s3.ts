import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const region = process.env.AWS_REGION
const bucket = process.env.AWS_S3_BUCKET
const cloudfront = process.env.CLOUDFRONT_DOMAIN // optional

let s3: S3Client | null = null
if(region && bucket){
  s3 = new S3Client({ region })
}

export async function generateSignedUpload(filename: string, contentType: string){
  if(!s3 || !bucket) throw new Error('AWS not configured')
  const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g,'_')}`
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 60 }) // 1 hour
  const fileUrl = cloudfront ? `https://${cloudfront}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  return { uploadUrl: signedUrl, fileUrl, key }
}
