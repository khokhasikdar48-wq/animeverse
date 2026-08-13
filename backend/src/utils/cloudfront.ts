import fs from 'fs'
import path from 'path'

// Helper to generate CloudFront signed URL if private key and key pair id are configured
export function getCloudFrontUrl(key:string, expiresInSeconds = 3600){
  const domain = process.env.CLOUDFRONT_DOMAIN
  if(!domain) return null
  const unsigned = `https://${domain}/${key}`

  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID
  const privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH
  if(!keyPairId || !privateKeyPath) return unsigned

  try{
    const pv = fs.readFileSync(path.resolve(privateKeyPath),'utf8')
    // Use aws-cloudfront-sign-like logic. Keep lightweight: implement RSA-SHA1 signature as CloudFront requires
    const crypto = require('crypto')
    const policy = JSON.stringify({ Statement:[{ Resource: unsigned, Condition:{ DateLessThan: { 'AWS:EpochTime': Math.floor(Date.now()/1000) + expiresInSeconds } } }] })
    const signer = crypto.createSign('RSA-SHA1')
    signer.update(policy)
    const signature = signer.sign(pv, 'base64')
    const urlSafeSig = signature.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
    const encodedPolicy = Buffer.from(policy).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
    return `${unsigned}?Policy=${encodedPolicy}&Signature=${urlSafeSig}&Key-Pair-Id=${keyPairId}`
  }catch(e){
    console.warn('CloudFront sign failed', e?.message || e)
    return unsigned
  }
}
