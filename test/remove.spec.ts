import 'mocha';
import { expect } from 'chai';
import * as path from 'path';

import { CMPManager } from '@src';
import { isCMPDescriptor, SimpleCMPDescriptor } from '@src/descriptors';

describe('Descriptor removal', () => {
  it('Should throw an error if removing a non-existent descriptor (no descriptors)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);

    expect(async () => manager.removeDescriptor('Nonexistant')).to.throw();
  });

  it('Should throw an error if removing a non-existent descriptor (1 descriptor)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);
  });
});