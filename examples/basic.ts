import type { QualwebPlugin } from '@qualweb/core';
import { CMPManager } from '@inqludeit/cmp-b-gone';

/**
 * This examples demonstrates the most basic, minimal, usage of the module.
 * 
 * It gets invoked by QualWeb right after a page loads but before QualWeb runs
 * any evaluation. In this state, a cookie banner should be visible. 
 * {@link CMPManager.parsePage} is then called to try and suppress the banner
 * on the page.
 */
export async function createPlugin(srcGlobs?: string | string[], includeBuiltIn: boolean = true): Promise<QualwebPlugin> {
  return _buildPlugin(await CMPManager.createManager(srcGlobs, includeBuiltIn));
}

function _buildPlugin(manager: CMPManager): QualwebPlugin {
  return {
    async afterPageLoad(page) {
      await manager.parsePage(page, {
        failOnMissing: true,
      });
    }
  }
}