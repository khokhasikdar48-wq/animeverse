# CloudFront & IAM

Example IAM policy for the ingestion worker is in infra/iam-policy-example.json. It grants S3 read/write and the ability to create CloudFront invalidations.

CloudFront signed URLs (private content) require a key-pair id and a private key. You can configure the following env vars in the backend to enable signed URL generation:

- CLOUDFRONT_DOMAIN — your distribution domain (e.g., d1234abcdef.cloudfront.net)
- CLOUDFRONT_KEY_PAIR_ID — the CloudFront key-pair id
- CLOUDFRONT_PRIVATE_KEY_PATH — path on the worker host to the PEM private key file used to sign policies

The backend includes a helper at backend/src/utils/cloudfront.ts which will attempt to sign the URL when both key pair id and private key path are provided.
