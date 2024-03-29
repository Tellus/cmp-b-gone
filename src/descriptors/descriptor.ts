import type { Page } from 'puppeteer';
import _ from 'lodash';
import { guessCaller, toArray } from '../util';
import { consola } from 'consola';
import { Cookie, LocalStorageData } from '../types';

/**
 * Type guard to try and ensure that a passed object is a valid CMPDescriptor.
 * @param obj Object to test.
 */
export function isCMPDescriptor(obj:unknown): obj is CMPDescriptor {
  const properties: (keyof CMPDescriptor)[] = ['acceptAll', 'name', 'isCMPPresent'];

  return properties.every(prop => _.hasIn(obj, prop));
}

export type CMPHandleFunction = (page: Page) => Promise<Page>;

type LocalStorageOption = {
  key: string;
  value?: string | RegExp;
}

export type LocalStorageConsentStorageOptions = {
  localStorage: (string | LocalStorageOption)[];
}

export type CookieConsentStorageOptions = {
  cookies: string | string[];
}

export function isCookieConsentStorageOptions(obj: any): obj is CookieConsentStorageOptions {
  const cookies = obj['cookies'];

  return typeof cookies === 'string' || (Array.isArray(cookies) && cookies.every(e => typeof e === 'string'));
}

export function isLocalStorageConsentStorageOptions(obj: any): obj is LocalStorageConsentStorageOptions {
  const ls = obj['localStorage'];

  return Array.isArray(ls) && ls.every(e => typeof e === 'string' || typeof e['key'] === 'string');
}

/**
 * Base that all CMP descriptors should implement. A descriptor has, at least,
 * methods to confirm the presence of a specific CMP banner, and a method to
 * fully accept it.
 */
export abstract class CMPDescriptor {
  /**
   * Returns true if the given page contains this CMPDescriptor's CMP. This
   * does not mean that the CMP is necessarily visible/active.
   * @param page The page to test.
   */
  abstract isCMPPresent(page: Page): Promise<boolean>;

  /**
   * Returns true if the CMP is considered active (i.e. the user has not yet
   * given specific consent). Generally, this is true if the CMP part of the DOM
   * is visible (rendered) in the browser window. Thus, this test may still
   * return true if the banner content is discoverable by a screen reader, but
   * is not rendered on-screen.
   * @param page The page to test.
   */
  abstract isCMPActive(page: Page): Promise<boolean>;

  abstract acceptAll(page: Page): Promise<Page>;

  #tagRef: () => string;

  /**
   * Get a tag for use when logging.
   */
  get tag(): string {
    return `${CMPDescriptor.name}: ${guessCaller(this.#tagRef)}`;
  }

  /**
   * If set, can be invoked to reject all cookies on the page.
   */
  rejectAll?: CMPHandleFunction;

  /**
   * If set, can be invoked to accept the default cookies on the site.
   */
  acceptDefault?: CMPHandleFunction;

  /**
   * Delete the CMP cookie in the page object, if it is present.
   * @param page The page to check cookies for.
   */
  async deleteConsentData(page: Page): Promise<boolean> {
    if (isLocalStorageConsentStorageOptions(this.storageOptions)) {
      page.evaluate((keys:string[]) => {
        keys.forEach(k => window.localStorage.removeItem(k));
      }, this.storageOptions.localStorage.map(st => typeof st === 'string' ? st : st.key));
      return true;
    } else if (isCookieConsentStorageOptions(this.storageOptions)) {
      const cookieNames = toArray(this.storageOptions.cookies);

      await page.deleteCookie(... cookieNames.map(c => ({ name: c })));

      return true;
    } else {
      throw new Error(`Unsupported storageOptions!`);
    }
  }

  /**
   * Retrieve the data that was stored as a result of giving consent to the CMP.
   * If the CMP stores data in cookies, an array of cookie data is returned. If
   * the CMP stores data in localStorage, a record of the relevant localStorage
   * entries is returned instead.
   * @param page Page with data to extract from.
   * @param failOnMissing Should an error be thrown if an expected value is
   * missing?
   */
  async getConsentData(page: Page, failOnMissing: boolean = false): Promise<Cookie[] | LocalStorageData[]> {
    const tag = this.tag;

    if (isLocalStorageConsentStorageOptions(this.storageOptions)) {
      return await page.evaluate((key:string[]) => {
        const returnData: LocalStorageData[] = [];
        const missingKeys = [];
        
        for (const k of key) {
          const v = window.localStorage.getItem(k);

          if (v === null) {
            missingKeys.push(k);
          } else {
            returnData.push({ key: k, value: v });
          }
        }

      if (failOnMissing === true && missingKeys.length > 0)
        throw new Error(`Missing data for keys: ${missingKeys.join(', ')}`);

        return returnData;
      }, this.storageOptions.localStorage.map(st => typeof st === 'string' ? st : st.key));
    } else if (isCookieConsentStorageOptions(this.storageOptions)) {
      const cookies = await page.cookies();
      // Local copy to avoid race conditions in the rare-rare-rare case that its
      // modified during execution.
      const storageOptions = typeof this.storageOptions.cookies === 'string' ? [this.storageOptions.cookies] : this.storageOptions.cookies;

      const toReturn = cookies.filter(c => storageOptions.includes(c.name));

      if (failOnMissing === true && toReturn.length !== storageOptions.length) {
        const msg = `Page cookie data is missing ${storageOptions.length - toReturn.length} expected cookies (expected ${storageOptions.join(', ')}, found ${cookies.map(c => c.name).join(', ')}).`;

        consola.error(tag, msg, {
          allCookies: cookies.map(c => c.name),
          expectedCookies: storageOptions,
          missingCookies: storageOptions.filter(c => storageOptions.includes(c) === false),
        });
        throw new Error(msg);
      }

      return toReturn;
    } else throw new Error(`Unrecognized storageOptions in config!`);
  }

  /**
   * Should return true if the CMP cookie is present in a page object. Note that
   * a lot of CMP providers store encoded/encrypted data in the cookie value,
   * so testing for *what* kind of cookie was set is probably not possible.
   * @param page The page object to check for cookies.
   */
  async hasConsentData(page: Page): Promise<boolean> {
    if (isLocalStorageConsentStorageOptions(this.storageOptions)) {
      const localStorage: Record<string, string> = await page.evaluate(() => {
        const data:Record<string, string> = {};

        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);

          if (k) {
            const toAdd = window.localStorage.getItem(k);
            
            if (toAdd) {
              data[k] = toAdd;
            } else {
              throw new Error(`Data at key "${k}" (index ${i}) is null.`);
            }
          } else throw new Error(`No key at index ${i} in localStorage.`);
        }

        return data;
      });

      return this.storageOptions.localStorage.every(st => {
        const ls = localStorage[typeof st === 'string' ? st : st.key];

        if (!ls) return false;
        else if (typeof st === 'string') {
          return true;
        } else {
          const value = st.value;

          switch (typeof value) {
            case 'string': return ls === value;
            case 'undefined': return true;
            default: return ls.match(st.value as RegExp);
          }
        }
      });
    } else if (isCookieConsentStorageOptions(this.storageOptions)) {
      const cookies = (await page.cookies()).map(c => c.name);

      if (typeof this.storageOptions.cookies === 'string') {
        return cookies.indexOf(this.storageOptions.cookies) >= 0;
      } else {
        return this.storageOptions.cookies.every(c => cookies.includes(c));
      }
    } else {
      throw new Error('Type of storageOptions must be CookieConsentStorageOptions or LocalStorageConsentOptions');
    }
  }

  /**
   * 
   * @param name Name of the descriptor. 
   * @param cookieName Name of the cookie that is stored when this CMP is
   * accepted.
   */
  constructor(readonly name:string, storageOptions: CookieConsentStorageOptions | LocalStorageConsentStorageOptions) {
    if (isLocalStorageConsentStorageOptions(storageOptions) || isCookieConsentStorageOptions(storageOptions)) {
      this.storageOptions = storageOptions;
    } else {
      throw new Error('Type of storageOptions must be CookieConsentStorageOptions or LocalStorageConsentOptions');
    }

    // We discover the tag Function early and store it, simply as an efficiency
    // measure. The value wont' change through the object's lifetime, and
    // looking it up every time the tag() getter is used seems more expensive
    // than simply storing a reference to it.
    const tagRef = Object.getOwnPropertyDescriptor(CMPDescriptor.prototype, 'tag')?.get;
    
    if (!tagRef) {
      throw new Error('Failed to get reference to tag getter! This is most likely an implementation error. File a bug report.');
    } else {
      this.#tagRef = tagRef;
    }
  }

  protected storageOptions: CookieConsentStorageOptions | LocalStorageConsentStorageOptions;

  getStorageOptions(): CookieConsentStorageOptions | LocalStorageConsentStorageOptions {
    return _.cloneDeep(this.storageOptions);
  }

  /**
   * Retrieves the keys (names) of all consent data that is recorded. This value
   * does NOT discriminate between storageOptions types and simply returns the
   * names of the keys.
   */
  get consentKeys(): string[] {
    if (isCookieConsentStorageOptions(this.storageOptions)) {
      return toArray(this.storageOptions.cookies);
    } else if (isLocalStorageConsentStorageOptions(this.storageOptions)) {
      return this.storageOptions.localStorage.map(st => typeof st === 'string' ? st : st.key);
    } else throw new Error(`Unsupported storageOptions!`);
  }
}
