# CMP plugin for QualWeb accessibility evaluator tool

The purpose of this plugin is to allow users of QualWeb to try and suppress CMP (Consent Management Platform) banners.

These banners are required on sites operated in the European Union, and are thus present on tonnes of websites.

The plugin tags onto into QualWeb's pre- and post- hooks and tries to identify the implementation in use on the site. If successful, it suppresses the banner, so it doesn't get evaluated by QualWeb.

The usefulness of this is twofold:

1. Some websites hide or completely withhold their actual content until consent to a cookie has been given. This plugin enables evaluating those sites with QualWeb by automating the consent action.
2. Many CMP banners have accessibility issues that are inherent to the implementation, and not the site itself. This causes a skew in the results of sites, giving the impression, for example, that the website has contrast issues when in fact the only component with contrast issues is the banner.

*NOTE: this software was built for the explicit purposes of enabling and enhancing automated accessibility testing, **NOT** to bypass the CMP banner for otherwise normal use of a website. If you use this software to bypass a banner it is presumed that you have accepted all terms of the site's use, including its cookie policy.*

# Installation

The package is designed to plug into QualWeb in a NodeJS project, and thus cannot be used if QualWeb's CLI is used (for example, if installed globally).

Install it like any other package:

`pnpm install @inqludeit/qualweb-plugin-cmp`

## Basic use

Sometime *before* calling `QualWeb#evaluate()`:

```typescript
import { createPlugin } from '@inqludeit/qualweb-plugin-cmp';
// Or use the non-async version.
qualweb.use(await createPlugin());
```

This will initialise the plugin with all the descriptors present in the package's `descriptors` folder.

During evaluation, the plugin will try to identify the CMP in use on a site to be evaluated. If it *fails* to detect any CMP, the evaluation will also be caused to fail. For this reason, we recommend running single URLs through QualWeb, since any missing descriptors will throw for the entire task.

## Beyond basic use

The plugin itself is just a wrapper around `CMPManager#parsePage()`, called in the `afterPageLoad` stage of QualWeb's evaluation.

For more advanced scenarios, build your own plugin with the specific steps you require. A few examples follow.

### Storing known descriptors between pages

```typescript
// Initialise the manager with default/built-in descriptors.
const manager = await CMPManager.createManager();

const descriptorCache: DescriptorConsentData[] = [];

const plugin: QualwebPlugin = {
  // Called *after* navigating to the target URL.
  async afterPageLoad(page, url) {
    // Initially, try to suppress the banner using already seen CMPs.
    for (const cachedDescriptor of descriptorCache) {
      const hit = await manager.parsePage(page, {
        descriptor: cachedDescriptor.descriptor,
      });

      if (hit !== null) {
        // Success! CMP should be suppressed, and we don't need to loop over all possible descriptors.
        return;
      }

      // Otherwise, keep looping.
    }

    // If no cached descriptor matched (or the cache is empty), run as normal.
    const descriptor = await manager.parsePage(page, {
      failOnMissing: false,
    })

    if (descriptor === null) {
      throw new Error(`Failed to find a descriptor on ${url}.`);
    }

    // Otherwise, we've found a working descriptor. Cache it for the next page.
    descriptorCache.push(descriptor);
  },
}
```

### Re-using results

`CMPManager#parsePage()` returns the name of the detected descriptor along with the cookie data were stored when the banner dismissed (that is, consent was given).

By passing that cookie data into a page before loading a target URL, you can effectively suppress the CMP banner for subsequent loads on the same domain.

```typescript
// Assume this has been filled previously, in a manner similar to the previous example.
const cache: Protocol.Network.Cookie[] = [];

const plugin: QualwebPlugin = {
  // Called by QualWeb *before* navigating to the target URL.
  beforePageLoad(page, url) {
    page.setCookie(...cache);
  },
}
```

# CMP descriptors

We call the object that can identify and bypass a cookie banner a "descriptor". 

Out of the box, this package comes bundled with a bunch of descriptors we've written by hand. They are all "simple" descriptors, based exclusively on CSS selectors.

Defining one of the descriptors is simply a matter of creating a new YAML file in the folder `dist/descriptors/yaml` and filling it out. See the other files in the folder for examples of how to do it.

It's also possible to add descriptors at run-time, by calling `CmpManager#addDescriptors()` or `CmpManager#addFrom()`. Descriptors added from code should extend the class `CMPDescriptor`, and implement the following:
- `isCMPPresent()` should return true if the CMP is detected on a page.
- `isCMPActive()` should return true if the CMP is *active* on a page. This differs from *detection* in that the banner should be visible/present for the user, not just in the DOM.
- `acceptAll()` should perform the actual work of bypassing the CMP banner.

In the basic descriptor `SimpleCMPDescriptor`, all of these are performed using a combination of CSS selectors and the methods exposed on Puppeteer's Page object.

## Future descriptors

It would be nice to create a centralized repository of CMP descriptors, like https://cookiedatabase.org, but usable by code.

# A note on Puppeteer versions

This plugin is compiled using the latest version of Puppeteer. This may cause typing issues if you are using an older version of Puppeteer where the interface of the `Page` type is different. Due to the broad way descriptors are designed, it isn't possible to restrict the typing and make older Puppeteer versions work out of the box.

We suggest using the latest Puppeteer in your own project in order to avoid compilation issues. If this is not possible  (for example, if QualWeb depends on an older version than the one currently used in this package), consider using overrides/resolutions in your `package.json` to force use of the same version across all dependencies.

For PNPM:

```json
{
  // Somewhere in your package.json file
  "resolutions": {
    "puppeteer": "^19.4.0" // Or whichever version you want to lock to
  }
}
```

For NPM:
```json
{
  // Somewhere in your package.json file
  "overrides": {
    "puppeteer": "^19.4.0" // Or whichever version you want to lock to
  }
}
```

Then re-run `pnpm i`/`npm i`/`yarn i` to update the dependencies.

**NOTE:** while this will make all parts of your project use the same version of Puppeteer, it may introduce other unexpected effects.