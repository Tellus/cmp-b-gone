/**
 * Simple script to quickly run an evaluation on a single url and dump the
 * results.
 */

import { QualWeb } from '@qualweb/core';
import { CMPManager } from '../src';
import { Command } from 'commander';
import { consola } from 'consola';

const command = new Command();

command.argument('<url>', 'URL to run QualWeb on.');

async function main(): Promise<void> {
  await command.parseAsync();

  const url = command.args[0];

  const cmpManager = await CMPManager.createManager(undefined, true);

  const qw = new QualWeb();

  qw.use({
    async afterPageLoad(page) {
      try {
        const cmp = await cmpManager.parsePage(page);

        consola.debug(cmp);
      } catch (_err: unknown) {
        const err = _err as Error;

        consola.error('Failed to parse page for CMPs', err);
      }
    }
  })

  await qw.start({
    
  }, {
    args: [
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--headless=new',
    ],
  });

  consola.info(`Starting evaluation of ${url}`);
  
  const evals = await qw.evaluate({
    url,
    execute: {
      act: true,
      bp: false,
      counter: false,
      wappalyzer: false,
      wcag: false,
    },
    "act-rules": {
      levels: [
        'A',
        'AA',
      ],
    },
  });
  
  if (!evals || Object.keys(evals).length == 0) {
    consola.error(`No reports were generated!`);
    process.exit(1);
  }

  consola.info(`Evaluation done!`);

  await qw.stop();
}

main();