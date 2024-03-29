Changelog

## 0.2.1

### Patch Changes

- 41136ed: Add some more exported types. No changes to functionality.

## 0.2.0

### Minor Changes

- 2c31d63: Add `CMPManager.removeDescriptor()`

## 0.1.0

### Minor Changes

- b81d7a1: # Rename to @inqludeit/cmp-b-gone

  This change detaches the plugin code (thin, QualWeb-specific wrapper) from the
  actual CMP handling code (which is meatier and only requires Puppeteer).

  It's part of a refactor to allow QualWeb to integrate CMP handling in its core
  module without cyclic dependencies in the dependency graph.

### Patch Changes

- dcca760: Silence consola by default
- dcca760: Add more detailed debug tag to SimpleDescriptor.acceptAll()
- 0958030: # Various minor hotfixes

  - Update all dependencies.
  - Updated an example to only import types from puppeteer (cleaner code).
  - Shifted @qualweb/core to be a peer dependency instead of a direct dependency. This better reflects the plugin/host relationship.
  - Removed @tsconfig/recommended and rolled its contents directly into tsconfig.json. Referencing the tsconfig.json file from the package doesn't play nice with how test/tsconfig.json imports the root file.

## 1.1.0

### Minor Changes

- 1570506: Switch to `consola` from `winston`

### Patch Changes

- 8ecd7ae: Moved tsconfig.test.json to test/tsconfig.json (improves IDE support)

## 1.0.4

### Patch Changes

- 1b09404: Moving away from semantic-release (documentation)

## [1.0.2](https://github.com/tellus/qualweb-plugin-cmp/compare/v1.0.1...v1.0.2) (2023-04-21)

### Bug Fixes

- corrected name of README file ([ec34db7](https://github.com/tellus/qualweb-plugin-cmp/commit/ec34db7636356544bf2f6f0a75e720ad7c3db828))

## [1.0.1](https://github.com/tellus/qualweb-plugin-cmp/compare/v1.0.0...v1.0.1) (2023-04-21)

### Bug Fixes

- corrected import in example ([fe287a9](https://github.com/tellus/qualweb-plugin-cmp/commit/fe287a94ccbf383ece578328fba1702a5619d0d0))

# 1.0.0 (2023-04-21)

### Features

- add basic plugin creation functions ([f219912](https://github.com/tellus/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/tellus/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/tellus/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/tellus/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/tellus/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))

# [1.0.0-next.2](https://github.com/tellus/qualweb-plugin-cmp/compare/v1.0.0-next.1...v1.0.0-next.2) (2023-04-21)

### Bug Fixes

- pointless fix commit ([26202be](https://github.com/tellus/qualweb-plugin-cmp/commit/26202be0c829631fe7dcc69418ff27e8bc78590d))

# 1.0.0-next.1 (2023-04-21)

### Bug Fixes

- a refactor hidden as a fix (ci test) ([67fe35e](https://github.com/tellus/qualweb-plugin-cmp/commit/67fe35e98275ae3b86e8a21e97b509b6e01da887))

### Features

- add basic plugin creation functions ([f219912](https://github.com/tellus/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/tellus/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/tellus/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/tellus/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/tellus/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))

# 1.0.0-next.1 (2023-04-20)

### Bug Fixes

- a refactor hidden as a fix (ci test) ([67fe35e](https://github.com/inqludeit/qualweb-plugin-cmp/commit/67fe35e98275ae3b86e8a21e97b509b6e01da887))

### Features

- add basic plugin creation functions ([f219912](https://github.com/inqludeit/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/inqludeit/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/inqludeit/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))

# 1.0.0-next.1 (2023-04-20)

### Bug Fixes

- a refactor hidden as a fix (ci test) ([67fe35e](https://github.com/inqludeit/qualweb-plugin-cmp/commit/67fe35e98275ae3b86e8a21e97b509b6e01da887))

### Features

- add basic plugin creation functions ([f219912](https://github.com/inqludeit/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/inqludeit/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/inqludeit/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))

# 1.0.0-next.1 (2023-04-20)

### Bug Fixes

- a refactor hidden as a fix (ci test) ([67fe35e](https://github.com/inqludeit/qualweb-plugin-cmp/commit/67fe35e98275ae3b86e8a21e97b509b6e01da887))

### Features

- add basic plugin creation functions ([f219912](https://github.com/inqludeit/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/inqludeit/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/inqludeit/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))

# [1.0.0-next.2](https://github.com/inqludeit/qualweb-plugin-cmp/compare/v1.0.0-next.1...v1.0.0-next.2) (2023-04-20)

### Bug Fixes

- a refactor hidden as a fix (ci test) ([67fe35e](https://github.com/inqludeit/qualweb-plugin-cmp/commit/67fe35e98275ae3b86e8a21e97b509b6e01da887))

# 1.0.0-next.1 (2023-04-20)

### Features

- add basic plugin creation functions ([f219912](https://github.com/inqludeit/qualweb-plugin-cmp/commit/f219912ed4ea2134adc4b14759db58222b02a758))
- change path to default/built-in descriptors to point to root of package instead of subdir of src. ([4b1fd5b](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4b1fd5b7379e63805b988d5e1589d80bbd1c54df))
- correct usage of puppeteer types ([fae28d2](https://github.com/inqludeit/qualweb-plugin-cmp/commit/fae28d20d2a62ad0ceee8e27ec9fa794b4932818))
- default Logger function should be no-op ([c7e6f63](https://github.com/inqludeit/qualweb-plugin-cmp/commit/c7e6f631e5bc3f4dd2c911f00a58c8361f96e228))
- use Logger utility everwhere ([4fb3cfa](https://github.com/inqludeit/qualweb-plugin-cmp/commit/4fb3cfa2fc8ef29d1972fa81b2d60e013745277d))
