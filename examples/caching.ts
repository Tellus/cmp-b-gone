import type { QualwebPlugin } from '@qualweb/core';
import { CMPManager, DescriptorConsentData } from '@inqludeit/cmp-b-gone';

export async function createCachingPlugin(): Promise<QualwebPlugin> {
  // Initialise the manager with default/built-in descriptors.
  const manager = await CMPManager.createManager();

  const descriptorCache: DescriptorConsentData[] = [];

  return {
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
}

