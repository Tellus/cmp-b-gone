import { consola } from 'consola';
import type { Page } from 'puppeteer';
import { CMPDescriptor, CookieConsentStorageOptions, LocalStorageConsentStorageOptions } from './descriptor';

export class SimpleCMPDescriptor extends CMPDescriptor {
  constructor(
    readonly cmpName: string,
    storageOptions: LocalStorageConsentStorageOptions | CookieConsentStorageOptions,
    readonly presenceSelectors: string[],
    readonly acceptAllSelectors: string[],
    readonly acceptDefaultSelectors?: string[],
    readonly rejectAllSelectors?: string[],
    readonly cmpTimeout: number = 2000,
  ) {
    super(cmpName, storageOptions);

    if (acceptDefaultSelectors) {
      const tag = `${this.name}.acceptDefault: `;

      this.acceptDefault = async (page: Page): Promise<Page> => {
        if (await this.isCMPPresent(page) === false) {
          throw new Error(`${tag}CMP "${this.name}" not present on page.`);
        } else {
          for (const selector of acceptDefaultSelectors) {
            const acceptDefaultButton = await page.$(selector);

            if (acceptDefaultButton !== null) {
              await acceptDefaultButton.click();
              return page;
            }
          }

          const errmsg = 'Failed to find and click acceptDefault input element.';
          
          consola.error(tag, errmsg, {
            acceptDefaultSelectors,
          });

          throw new Error(`${errmsg}. Attempted the following selectors: ${acceptDefaultSelectors.join(', ')}`);
        }
      };
    }

    const rejectAllSelector = this.rejectAllSelectors;
    if (rejectAllSelector !== undefined) this.rejectAll = async (page): Promise<Page> => {
      const tag = `${this.tag}.rejectAll`;

      let timespent = 0;

      while (timespent < this.cmpTimeout) {
        const preTime = Date.now();

        for (const selector of rejectAllSelector) {
          const el = await page.$(selector);
  
          if (el !== null) {
            await el.click();
            return page;
          }
        }

        timespent += (Date.now() - preTime);
      }

      const msg = `Failed to click on rejection element.`;
      consola.error(tag, msg, {
        selectorsTested: this.rejectAllSelectors,
      });

      throw new Error(msg);
    };

    const acceptDefaultSelector = this.acceptDefaultSelectors;
    if (acceptDefaultSelector !== undefined) this.acceptDefault = async (page): Promise<Page> => {
      const tag = `${this.tag}.acceptDefault`;

      let timespent = 0;
      
      while (timespent < this.cmpTimeout) {
        const preTime = Date.now();

        for (const selector of acceptDefaultSelector) {
          const el = await page.$(selector);
  
          if (el !== null) {
            await el.click();
            return page;
          }
        }

        timespent += (Date.now() - preTime);
      }

      const msg = `Failed to click on rejection element.`;
      consola.error(tag, msg, {
        selectorsTested: this.acceptDefaultSelectors,
      });

      throw new Error(msg);
    };
  }

  async isCMPPresent(page: Page): Promise<boolean> {
    let timespent = 0;

    // Keep trying and backing off until we succeed or we're tired of waiting.
    while (timespent < this.cmpTimeout) {
      const preTime = Date.now();

      for (const selector of this.presenceSelectors) {
        try {
          // We "micro-wait" for the selectors, so we can iterate through all
          // iterators until we might actually hit one that's displayed.
          await page.waitForSelector(selector, {
            timeout: 200,
          });

          return true;
        } catch (_err: unknown) {
          // Wasn't found. Continue.
        }
      }

      timespent += (Date.now() - preTime);
    }

    return false;
  }

  async acceptAll(page: Page): Promise<Page> {
    const tag = `${this.tag}.${SimpleCMPDescriptor.prototype.acceptAll.name} (${page.url()})`;

    let timespent = 0;

    while (timespent < this.cmpTimeout) {
      const preTime = Date.now();
      for (const selector of this.acceptAllSelectors) {
        const el = await page.$(selector);

        // Early bailout.
        if (el === null) {
          consola.verbose(tag, `No elements for selector "${selector}" found.`, {
            selector,
          });

          continue;
        }

        // Attempt a number of various "clicking" actions, in this order:
        // - click as performed by Puppeteer. Best option, scrolls element into
        // view, acts like a real human being.
        // - click via JavaScript. Fallback for when the best option fails.
        // simple sends a click event through JavaScript to the element, and we
        // cross our fingers hoping that the code does what it's supposed to.

        try {
          const requestHandler = (ev: any) => {
            consola.verbose(tag, 'Request!', {
              event: ev,
            });
            if (ev.isNavigationRequest()) {
              consola.warn(tag, 'A navigation request was initiated! This may cause the CMP manager to crash!');
            }
          };

          page.on('request', requestHandler);

          consola.verbose(tag, `Trying to click element`, {
            selector,
          });

          await el.click();

          consola.verbose(tag, 'Click complete!');

          page.off('request', requestHandler);

          consola.verbose(tag, `Waiting for ${this.cmpTimeout} timeout after accepting all cookies.`);

          // Allow javascript to run cookie storage.
          // await page.waitForFunction(() => {
          //   return new Promise(r => setTimeout(r, this.cmpTimeout));
          // });

          // Alternate waiting method that runs outside of Puppeteer. This
          // should prevent exceptions caused by page navigation.
          await new Promise(r => setTimeout(r, this.cmpTimeout));

          consola.verbose(tag, 'Waiting for timeout DONE! Returning page to caller');

          return page;
        } catch (_err: unknown) {
          const err = _err as Error;
          consola.verbose(tag, `Failed to perform Puppeteer click on ${selector}`, { err });
        }

        try {
          consola.verbose(tag, `Trying to click element via JavaScript`, {
            selector,
          });

          await el.evaluate((el:any) => el.click());

          // Allow javascript to run cookie storage.
          // await page.waitForFunction(() => {
          //   return new Promise(r => setTimeout(r, this.cmpTimeout));
          // });

          // Alternate waiting method that runs outside of Puppeteer. This
          // should prevent exceptions caused by page navigation.
          await new Promise(r => setTimeout(r, this.cmpTimeout));

          return page;
        } catch (_err: unknown) {
          const err = _err as Error;
          consola.verbose(tag, `Failed to perform Puppeteer click on ${selector}`, { err });
          throw _err;
        }
      }
      // Add the time the loop took to our time spent. We'll stop trying once
      // this time exceeds our tolerance/maximum (cmpTimeout).
      timespent += (Date.now() - preTime);
    }

    const msg = `Failed to find and/or click any elements for acceptAll.`;
    consola.error(tag, msg, { acceptAllSelectors: this.acceptAllSelectors });
    throw new Error(msg);
  }

  async isCMPActive(page: Page): Promise<boolean> {
    const tag = this.tag;

    let timespent = 0;

    // Keep trying and backing off until we succeed or we're tired of waiting.
    while (timespent < this.cmpTimeout) {
      const preTime = Date.now();

      for (const selector of this.presenceSelectors) {

        try {
          // We "micro-wait" for the selectors, so we can iterate through all
          // iterators until we might actually hit one that's displayed.
          const el = await page.waitForSelector(selector, {
            visible: true,
            timeout: 200,
          });

          const bbox = await el?.boundingBox();

          if (bbox) {
            consola.info(tag, `Bounding box detected.`, {
              boundingBox: bbox,
            });
            return true;
          } else {
            return false;
          }

          return (await el?.boundingBox()) !== null;
        } catch (_err: unknown) {
          // Wasn't found. Continue.
        }
      }

      timespent += (Date.now() - preTime);
    }

    return false;
  }
}
