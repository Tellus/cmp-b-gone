import type { QualwebPlugin } from '@qualweb/core';
import { CMPManager } from './cmpmanager';

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