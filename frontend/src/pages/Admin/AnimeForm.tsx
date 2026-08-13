---
*** Begin Patch
*** Update File: frontend/src/pages/Admin/AnimeForm.tsx
@@
-      <div className="mt-3">
-          <button onClick={onSave} className="px-4 py-2 bg-accent rounded text-black">Save</button>
-        </div>
+      <div className="mt-3">
+          <button onClick={onSave} disabled={false} className="px-4 py-2 bg-accent rounded text-black">Save</button>
+        </div>
+        { /* could show poster upload progress here if desired */ }
       </div>
     </div>
   )
 }
*** End Patch
