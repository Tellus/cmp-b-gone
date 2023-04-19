import { SimpleCMPDescriptor, CMPDescriptor } from '@src/descriptors';

export default function buildDescriptor(): CMPDescriptor {
  return new SimpleCMPDescriptor('descriptor.ts', { cookies: ['aCookieName'] }, [''], ['']);
}