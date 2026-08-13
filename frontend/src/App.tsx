---
*** Begin Patch
*** Update File: frontend/src/App.tsx
@@
 import AdminJobs from './pages/Admin/Jobs'
 import AdminJobDetail from './pages/Admin/JobDetail'
+import AdminAdsMetrics from './pages/Admin/AdsMetrics'
@@
             <Route path="/admin/jobs" element={<AdminJobs />} />
             <Route path="/admin/jobs/:id" element={<AdminJobDetail />} />
+            <Route path="/admin/ads-metrics" element={<AdminAdsMetrics />} />
           </Routes>
*** End Patch
