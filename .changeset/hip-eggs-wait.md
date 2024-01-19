---
"@inqludeit/cmp-b-gone": patch
---

# Various minor hotfixes

- Update all dependencies.
- Updated an example to only import types from puppeteer (cleaner code).
- Shifted @qualweb/core to be a peer dependency instead of a direct dependency. This better reflects the plugin/host relationship.
- Removed @tsconfig/recommended and rolled its contents directly into tsconfig.json. Referencing the tsconfig.json file from the package doesn't play nice with how test/tsconfig.json imports the root file.