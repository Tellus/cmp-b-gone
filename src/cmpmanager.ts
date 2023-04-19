import { Logger, guessCaller } from './util';
import { Page } from 'puppeteer';
import * as Descriptors from './descriptors';
import { globSync } from 'glob';
import { DescriptorConsentData } from './types';
import * as path from 'path';
import YamlDescriptor from './descriptors/yaml';
import _ from 'lodash';
import { LocalStorageData } from '.';
import NullDescriptor from './descriptors/null';

export interface ParsePageOptions {
  /**
   * If true (the default), parsePage will throw an error if the expected
   * number of cookies or localStorage items can't be found.
   */
  failOnMissing?: boolean;

  /**
   * If set, CMPManager will *only* use this CMPDescriptor to parse the page.
   * Use this to save processing time if you know specifically which descriptor
   * to look for.
   */
  descriptor?: string;
}

const defaultParsePageOptions: ParsePageOptions = {
  failOnMissing: true,
};

/**
 * General management class. The CMP manager imports any number of CMP
 * descriptions and handles running through a puppeteer Page to handle the
 * banner. You can subscribe to an event to be notified when/if the manager
 * finds and handles a cookie banner, that also contains the cookie that was
 * stored as a result.
 */
export class CMPManager {
  /**
   * Internal list of known descriptors.
   * TODO: should this be a list of constructors, for injection, or instances?
   */
  protected descriptors: Descriptors.CMPDescriptor[] = [];

  #tagRef: () => string;

  /**
   * Get a tag for use when logging.
   */
  get tag(): string {
    return `${CMPManager.name}: ${guessCaller(this.#tagRef)}`;
  }

  /**
   * Get the names of all currently loaded CMP descriptors.
   */
  get descriptorNames(): string[] {
    return this.descriptors.map(descriptor => descriptor.name);
  }

  /**
   * Constructs an empty CMPManager. Be sure to add some descriptors (see
   * {@link addDescriptors} or {@link addFrom}) before use.
   */
  protected constructor() {
    // We discover the tag Function early and store it, simply as an efficiency
    // measure. The value wont' change through the object's lifetime, and
    // looking it up every time the tag() getter is used seems more expensive
    // than simply storing a reference to it.
    const tagRef = Object.getOwnPropertyDescriptor(CMPManager.prototype, 'tag')?.get;
    
    if (!tagRef) {
      throw new Error('Failed to get reference to tag getter! This is most likely an implementation error. File a bug report.');
    } else {
      this.#tagRef = tagRef;
    }
  }

  /**
   * Add new descriptors to the manager. You can either pass in globs/paths to
   * files containing the descriptors, or instances of CMPDescriptor. A file
   * that contains a descriptor must export a default function that constructs
   * an instance of the CMPDescriptor to use.
   * @param source Source path(s) for the descriptors to add, or instances of
   * existing descriptors.
   * @returns The manager itself.
   */
  async addDescriptors(source: string | string[] | Descriptors.CMPDescriptor[]): Promise<this> {
    if (Array.isArray(source) === false && typeof source === 'string') {
      // Single file/glob. Import.

      Logger.verbose(this.tag, `Adding descriptor(s) from source "${source}"`);

      await this.addFrom(source);
    } else if (source.length > 0) {
      if (typeof source[0] === 'string') {
        // Multiple files/globs. import.

        Logger.verbose(this.tag, `Adding descriptors from ${source.length} sources.`, { sources: source });

        await this.addFrom(source as string[]);
      } else {
        // Multiple descriptor objects.
        const sources = source as Descriptors.CMPDescriptor[];

        Logger.verbose(this.tag, `Adding ${source.length} descriptors.`, { sources: sources.map(source => source.name) });

        this.descriptors.push(... sources);
      }
    }

    Logger.verbose(this.tag, `Manager now knows ${this.descriptorNames.length} descriptors.`);

    return this;
  }

  /**
   * Tries to import a CMPDescriptor from the given path, by running the default
   * exported function.
   * @param importPath Absolute path to the file to import. This method does *not*
   * adjust extensions in case you're running pure Node instead of ts-node or
   * similar - so make sure this points to a .js file if necessary.
   * @returns The new CMPDescriptor if successful, null otherwise.
   */
  async #importSingle(importPath: string): Promise<Descriptors.CMPDescriptor | null> {
    const extension = path.extname(importPath).toLowerCase();

    if (['.yaml', '.yml'].includes(extension)) {
      // Attempt YAML import.
      return YamlDescriptor.createFromPath(importPath, 'utf-8');
    } else {
      if (['.ts', '.js'].includes(extension) === false) {
        Logger.warn(this.tag, `Unknown file extension "${extension}". Attempting to import as module.`, {
          file: importPath,
        });
      }

      try {
        const module = await import(importPath);
  
        const newDescriptor = module.default();
  
        if (Descriptors.isCMPDescriptor(newDescriptor)) {
          return newDescriptor;
        } else {
          const msg = `Failed to import from "${importPath}".`;
          Logger.error(this.tag, msg);
          return null;
        }
      } catch (_err: unknown) {
        Logger.error(this.tag, `Failed to add descriptor from path "${importPath}"`, { err: _err });
  
        return null;
      }
    }
  }

  /**
   * Tries to add CMPDescriptors from all files found in the glob/path given as
   * parameter. Imports that fail will simply be ignored. Any discovered
   * CMPDescriptors are automatically added to the manager.
   * @param path Glob or single path of descriptors to import.
   * @returns The manager itself.
   */
  async addFrom(path: string | string[]): Promise<this> {
    if (typeof path === 'string') path = [path];

    const paths: Set<string> = new Set();
    for (const p of path) {
      globSync(p).forEach((p) => paths.add(p));
    }

    const newDescriptors = (await Promise.all(Array.from(paths).map(p => this.#importSingle(p)))).filter(d => d !== null) as Descriptors.CMPDescriptor[];

    this.descriptors.push(...newDescriptors);

    Logger.verbose(this.tag, `Added from ${path.length} descriptors.`, { paths: path });

    return this;
  }

  /**
   * Creates a new CMPManager. Since the list of CMPDescriptors is imported on
   * construction, this async factory method is necessary to ensure that all
   * descriptors have been imported before first use.
   * @param srcGlobs Optional list of additional files/directories to scan for
   * CMPDescriptors. Each file's default export must be a function that returns
   * a CMPDescriptor object, or a YAML file describing the details.
   * @param includeBuiltIn If false, will *not* include the default/built-in
   * descriptors in "contrib" and "yaml".
   * @see YamlDescriptorFile
   */
  static async createManager(srcGlobs?: string | string[], includeBuiltIn: boolean = true): Promise<CMPManager> {
    const manager = new CMPManager();

    if (srcGlobs)
      await manager.addDescriptors(srcGlobs);

    if (includeBuiltIn === true) {
      // Add complex/manually implemented descriptors.
      await manager.addFrom(path.join(__dirname, 'descriptors/contrib/*.ts'));
  
      // Add YAML-defined simple descriptors.
      await manager.addFrom(path.join(__dirname, 'descriptors/yaml/*.yaml'));
      await manager.addFrom(path.join(__dirname, 'descriptors/yaml/*.yml'));
    }

    return manager;
  }

  getDescriptor(descriptor: string): Descriptors.CMPDescriptor | undefined {
    switch (descriptor) {
      case 'NullDescriptor': return new NullDescriptor();
      default: return this.descriptors.find(d => d.name === descriptor);
    }
  }

  /**
   * Iterates over all known CMPDescriptors, trying to detect the presence of
   * a CMP solution on the page object. If a CMP presence is detected, the
   * "accept all" function is invoked. If no CMPDescriptors match the page, a
   * null result is returned. This does *not* mean that no CMP was present,
   * only that none of the descriptors could find it.
   * @param page The page to detect CMP presence in.
   * @returns The results of going over the page with all descriptors. The may
   * be a null result if @see CookieResult.cookie is null. In that case, no
   * CMP presence was detected.
   */
  async parsePage(page: Page, options?: ParsePageOptions): Promise<DescriptorConsentData | null> {
    const tag = this.tag;

    const actualOptions = _.merge(defaultParsePageOptions, options);

    const descriptors: Descriptors.CMPDescriptor[] = [];

    if (actualOptions.descriptor) {
      const descriptor = this.getDescriptor(actualOptions.descriptor);
      if (descriptor) {
        descriptors.push(descriptor);
      } else {
        throw new Error(`Unknown descriptor "${actualOptions.descriptor}".`);
      }
    }

    const descPromises = (descriptors.length > 0 ? descriptors : this.descriptors).map(descriptor => new Promise(async (resolve, reject) => {
      if (await descriptor.isCMPActive(page) === true) {
        resolve(descriptor);
      } else {
        reject();
      }
    }));

    let detectedDescriptor: Descriptors.CMPDescriptor;
    try {
      detectedDescriptor = (await Promise.any(descPromises)) as Descriptors.CMPDescriptor;
    } catch (_err: unknown) {
      Logger.warn(this.tag, `No CMP handlers matched for "${page.url()}". This might not be an error.`, {
        url: page.url(),
      });
      return null;
    }

    Logger.verbose(tag, `Detected descriptor "${detectedDescriptor.name}" on page`, {
      url: page.url(),
      detectedDescriptor,
    });

    const oldCookies = await page.cookies();

    await detectedDescriptor.acceptAll(page);

    let cookies = await page.cookies();

    let timeSpent = 0;
    const timeout = 2000;

    // Loop until any of the descriptor's cookies are present, or the
    // timeout is reached. The current descriptor logic looks for "any of"
    // the cookies mentioned, NOT "all of" the cookies mentioned. 
    while (!cookies.find(c => detectedDescriptor.consentKeys.includes(c.name)) && timeSpent < timeout) {
      // As long as no CMP cookies are present...

      const timeThen = Date.now();

      cookies = await page.cookies();

      timeSpent += (Date.now() - timeThen);
    }

    if (!cookies.find(c => detectedDescriptor.consentKeys.includes(c.name))) {
      Logger.warn(tag, `Failed to detect CMP data for positive descriptor ${detectedDescriptor.name}`, {
        expectedCookies: detectedDescriptor.consentKeys,
        presentCookies: cookies.map(c => c.name),
      });
    }

    // Try to retrieve localStorage. This may fail if the page navigates
    // upon accepting cookies!
    const localStorageToStore: LocalStorageData[] = [];
    try {
      await page.evaluate(async function () {
        const localStorageValues: LocalStorageData[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);

          if (k) {
            const v = localStorage.getItem(k);

            if (v) {
              localStorageValues.push({
                key: k,
                value: v,
              });
            } else {
              throw new Error(`Value for key ${k} is null!`);
            }
          } else {
            throw new Error(`No key for index ${i} exists!`);
          }
        }

        return localStorageValues;
      });
    } catch (_err: unknown) {
      Logger.error(tag, `Failed to query localStorage!`, {
        err: _err as Error,
      });
    }

    return {
      descriptor: detectedDescriptor.name,
      cookies: cookies.length > 0 ? cookies : undefined,
      localStorage: localStorageToStore.length > 0 ? localStorageToStore : undefined,
    };

    // try {
    //   consentData = await descriptor.getConsentData(page, options?.failOnMissing == true);
    // } catch (_err:unknown) {
    //   Logger.info(tag, `Failed to retrieve consent data. Backing off and trying again.`, {
    //     error: _err,
    //   });

    //   await page.waitForTimeout(2000);

    //   consentData = await descriptor.getConsentData(page, options?.failOnMissing == true);
    // }

    // return {
    //   detectedBy: descriptor.name,
    //   consentData,
    // };
  }

  /**
   * Checks to see if a CMP is *present* (but not necessarily visible) on a
   * page. Note that some CMPs will not be present in the DOM if the page was
   * loaded using matching consent cookies.
   * Note that some CMP descriptors can't clearly establish whether they are
   * present if the page was loaded with consent data already injected. For
   * example, some instances of the CookieBot CMP will simply not be present
   * in the DOM if a page was loaded with consent cookies already present. See
   * the documentation for individual CMPDescriptors for more information.
   * @param page The page (post-navigation, post-load) to find CMP in.
   * @param descriptor If given, the specific descriptor to use for the check.
   * The method will only apply this single descriptor instead of testing all
   * loaded descriptors.
   */
  async cmpPresent(page: Page): Promise<Descriptors.CMPDescriptor | null>;
  async cmpPresent(page: Page, descriptor: string): Promise<boolean>;
  async cmpPresent(page: Page, descriptor?: string): Promise<boolean | (Descriptors.CMPDescriptor | null)> {
    if (typeof descriptor === 'string') {
      // Use specific descriptor for action.
      const descriptorInstance = this.getDescriptor(descriptor);
  
      if (!descriptorInstance) {
        throw new Error(`No such descriptor: ${descriptor}`);
      }
  
      return descriptorInstance.isCMPPresent(page);
    } else if (typeof descriptor === 'undefined') {
      const detectedCmp = await this.detectCMP(page);

      if (detectedCmp !== null && await detectedCmp.isCMPPresent(page) === true)
        return detectedCmp;
      else
        return false;
    } else throw new Error(`Invalid argument passed as descriptor ("${descriptor}", type: ${typeof descriptor})`);
  }

  async detectCMP(page: Page): Promise<Descriptors.CMPDescriptor | null> {
    for (const descriptor of this.descriptors) {
      if (await descriptor.isCMPPresent(page))
        return descriptor;
    }

    return null;
  }

  /**
   * Tests to see if a given CMP descriptor is present AND visible (i.e. active)
   * on a page.
   * Note that some CMP descriptors can't clearly establish whether they are
   * present if the page was loaded with consent data already injected. For
   * example, some instances of the CookieBot CMP will simply not be present
   * in the DOM if a page was loaded with consent cookies already present. See
   * the documentation for individual CMPDescriptors for more information.
   * @param page The page (post-navigation, post-load) to find a CMP in.
   * @param descriptor If given, the specific descriptor to use for the check.
   * The method will only apply this single descriptor instead of testing all
   * loaded descriptors.
   */
   async cmpActive(page: Page): Promise<Descriptors.CMPDescriptor | null>;
   async cmpActive(page: Page, descriptor: string): Promise<boolean>;
   async cmpActive(page: Page, descriptor?: string): Promise<boolean | (Descriptors.CMPDescriptor | null)> {
     if (typeof descriptor === 'string') {
       // Use specific descriptor for action.
       const descriptorInstance = this.getDescriptor(descriptor);
   
       if (!descriptorInstance) {
         throw new Error(`No such descriptor: ${descriptor}`);
       }
   
       return descriptorInstance.isCMPActive(page);
     } else if (typeof descriptor === 'undefined') {
       const detectedCmp = await this.detectCMP(page);
 
       if (detectedCmp !== null && await detectedCmp.isCMPActive(page) === true)
         return detectedCmp;
       else
         return false;
     } else throw new Error(`Invalid argument passed as descriptor ("${descriptor}", type: ${typeof descriptor})`);
   }
}