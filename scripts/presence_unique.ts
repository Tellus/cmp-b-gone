/**
 * Quick 'n dirty script that ensures that all YAML descriptors have *unique*
 * presence selectors.
 */

import * as glob from 'glob';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { load } from 'js-yaml';
import { Logger } from '../src/util';

async function main(): Promise<void> {
  const sourcePath = path.resolve('src', 'descriptors', 'yaml', '*.@(yaml|yml)');

  const yamlDescriptorFiles = glob.sync(sourcePath);

  Logger.debug(`Parsing ${yamlDescriptorFiles.length} YAML descriptors in ${sourcePath}.`);

  const presenceSelectors: Map<string, string[]> = new Map();

  for (const yamlDescriptorFile of yamlDescriptorFiles) {
    const descriptor = load(await fs.readFile(yamlDescriptorFile, 'utf-8')) as { selectors?: { presence: string | string[] }};

    let presenceField: string[];

    if (descriptor.selectors?.presence !== undefined && Array.isArray(descriptor.selectors?.presence)) {
      presenceField = descriptor.selectors?.presence;
    } else if (typeof (descriptor.selectors?.presence) === 'string') {
      presenceField = [ descriptor.selectors.presence ];
    } else {
      Logger.warn(`NO presence selectors in ${yamlDescriptorFile}!`);
      continue;
    }

    const presence: string[] = Array.isArray(presenceField)
      ? presenceField
      : [ presenceField ];

    for (const presenceSelector of presence) {
      const existing = presenceSelectors.get(presenceSelector);

      if (existing !== undefined) {
        // Logger.error(`Selector ${presenceSelector} already exists! (duplicate was encountered in ${yamlDescriptorFile})`);
        existing.push(yamlDescriptorFile);
        presenceSelectors.set(presenceSelector, existing);
      } else {
        // Logger.info(`Selector ${presenceSelector} is unique (so far).`);
        presenceSelectors.set(presenceSelector, [
          yamlDescriptorFile,
        ]);
      }
    }
  }

  for (const e of presenceSelectors.entries()) {
    if (e[1].length > 1) {
      Logger.debug(`${e[0]} (${e[1].length}):`);
      e[1].forEach(e => Logger.debug(e));
    }
  }
}

main();