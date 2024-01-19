---
"@inqludeit/cmp-b-gone": minor
---

# Rename to @inqludeit/cmp-b-gone

This change detaches the plugin code (thin, QualWeb-specific wrapper) from the
actual CMP handling code (which is meatier and only requires Puppeteer).

It's part of a refactor to allow QualWeb to integrate CMP handling in its core
module without cyclic dependencies in the dependency graph.