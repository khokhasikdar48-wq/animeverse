---
*** Begin Patch
*** Update File: frontend/src/App.tsx
@@
 import AdminJobs from './pages/Admin/Jobs'
+import AdminJobDetail from './pages/Admin/JobDetail'
@@
             <Route path="/admin/jobs" element={<AdminJobs />} />
+            <Route path="/admin/jobs/:id" element={<AdminJobDetail />} />
*** End Patch
