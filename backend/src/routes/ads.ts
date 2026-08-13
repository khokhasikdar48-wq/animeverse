---
*** Begin Patch
*** Update File: backend/src/routes/ads.ts
@@
-import { AD_PROVIDER, AD_VERIFY_URL, AD_API_KEY } from '../config'
+import { requestRateLimit, unlockQuotaLimit } from '../middleware/rateLimit'
@@
-router.post('/reward/init', authMiddleware, async (req,res)=>{
+// Apply a light rate limit on init requests (per-hour)
+router.post('/reward/init', authMiddleware, requestRateLimit({ windowSeconds: 60*60, limit: Number(process.env.AD_RATE_LIMIT_REQUESTS_PER_HOUR || '20'), keyPrefix: 'rate:ads:init' }), async (req,res)=>{
@@
-// POST /api/ads/reward/verify
+// POST /api/ads/reward/verify
 // Body: { episodeId, completionToken, serverNonce }
 // Server verifies the completionToken with configured provider (or mock) and creates a temporary unlock record
-router.post('/reward/verify', authMiddleware, async (req,res)=>{
+router.post('/reward/verify', authMiddleware, requestRateLimit({ windowSeconds: 60*60, limit: Number(process.env.AD_RATE_LIMIT_REQUESTS_PER_HOUR || '20'), keyPrefix: 'rate:ads:verify' }), unlockQuotaLimit(Number(process.env.AD_RATE_LIMIT_UNLOCKS_PER_DAY || '5'), 24*3600), async (req,res)=>{
*** End Patch
