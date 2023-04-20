import type { QualwebPlugin } from '@qualweb/core';
import { Protocol } from 'puppeteer';

export function createSuppressingPlugin(): QualwebPlugin {
  // Assume this has been filled previously, in a manner similar to the previous example.
  const cache: Protocol.Network.Cookie[] = [];

  return {
    beforePageLoad(page, url) {
      page.setCookie(...cache);
    },
  }
}