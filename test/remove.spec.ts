import 'mocha';
import { expect } from 'chai';
import * as path from 'path';

import { CMPManager } from '../src';
import { isCMPDescriptor, SimpleCMPDescriptor } from '@src/descriptors';

describe('Descriptor removal', () => {
  it('Should throw an error if removing a non-existent descriptor (no descriptors)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);

    expect(() => manager.removeDescriptor('Nonexistant')).to.throw();
  });

  it('Should throw an error if removing a non-existent descriptor (1 descriptor)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);

    // Add a descriptor with a *different* name than the one we want to try and
    // remove.
    manager.addDescriptors([
      new SimpleCMPDescriptor(
        'successful-descriptor',
        { cookies: ['cookie-name'] },
        ['#cookie-banner-div'],
        ['#cookie-banner-accept-all'],
        ['#cookie-banner-accept-default'],
      ),
    ]);

    // Expect an attempt to remove a non-existent descriptor to fail.
    expect(() => manager.removeDescriptor('Nonexistant')).to.throw;
  });

  it('Should correctly remove a descriptor (lone descriptor)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);

    const descriptor = new SimpleCMPDescriptor(
      'successful-descriptor',
      { cookies: ['cookie-name'] },
      ['#cookie-banner-div'],
      ['#cookie-banner-accept-all'],
      ['#cookie-banner-accept-default'],
    );

    // Add a descriptor with a *different* name than the one we want to try and
    // remove.
    manager.addDescriptors([descriptor]);

    // Make sure it was correctly added.
    expect(manager.descriptorNames).to.have.length(1);
    expect(manager.descriptorNames).to.include(descriptor.name);

    // Expect an attempt to remove a non-existent descriptor to fail.
    manager.removeDescriptor(descriptor.name);

    expect(manager.descriptorNames).to.be.empty;
  });

  it('Should correctly remove a descriptor (2 descriptors)', async () => {
    // Create manager with no descriptors.
    const manager = await CMPManager.createManager(undefined, false);

    const descriptorToRemove = new SimpleCMPDescriptor(
      'successful-descriptor',
      { cookies: ['cookie-name'] },
      ['#cookie-banner-div'],
      ['#cookie-banner-accept-all'],
      ['#cookie-banner-accept-default'],
    );

    const descriptorToKeep = new SimpleCMPDescriptor(
      'successful-descriptor',
      { cookies: ['cookie-name'] },
      ['#cookie-banner-div'],
      ['#cookie-banner-accept-all'],
      ['#cookie-banner-accept-default'],
    );

    // Add a descriptor with a *different* name than the one we want to try and
    // remove.
    manager.addDescriptors([
      descriptorToKeep,
      descriptorToRemove,
    ]);

    // Make sure it was correctly added.
    expect(manager.descriptorNames).to.have.length(2);
    expect(manager.descriptorNames).to.include(descriptorToKeep.name);
    expect(manager.descriptorNames).to.include(descriptorToRemove.name);

    // Expect an attempt to remove a non-existent descriptor to fail.
    manager.removeDescriptor(descriptorToRemove.name);

    expect(manager.descriptorNames).to.have.length(1);
    expect(manager.descriptorNames).to.include(descriptorToKeep.name);
  });
});