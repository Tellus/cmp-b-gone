import 'mocha';
import { expect, assert } from 'chai';
import { SimpleCMPDescriptor } from '../src/descriptors/simple';
import { withBrowserPage, withStaticServer } from './util';
import { CookieConsentStorageOptions } from '../src/descriptors/descriptor';

function minimalFixture(): SimpleCMPDescriptor {
  return new SimpleCMPDescriptor('successful-descriptor', { cookies: ['cookie-name'] }, ['#cookie-banner-div'], ['#cookie-banner-accept-all']);
}

function fullFixture(): SimpleCMPDescriptor {
  return new SimpleCMPDescriptor(
    'successful-descriptor',
    { cookies: ['cookie-name'] },
    ['#cookie-banner-div'],
    ['#cookie-banner-accept-all'],
    ['#cookie-banner-accept-default'],
  );
}

describe(SimpleCMPDescriptor.name, function () {
  this.timeout('60s');

  it('Should detect a cookie banner on a page (minimal)', async () => {
    const desc = minimalFixture();

    await withStaticServer(async (host) => {
      await withBrowserPage(async page => {
        await page.goto(`http://${host}/cookiesite.html`);

        expect(await desc.isCMPPresent(page)).to.be.true;
        expect(() => desc.acceptAll(page)).to.not.throw;
      });
    });
  });

  it('Should fail to detect a cookie banner on a page without any (minimal)', async () => {
    const desc = minimalFixture();

    await withStaticServer(async (host) => {
      await withBrowserPage(async page => {
        await page.goto(`http://${host}/nocookiesite.html`);

        expect(await desc.isCMPPresent(page)).to.be.false;
      });
    });
  });

  it('Should fail to accept a cookie banner on a page without any (minimal)', async () => {
    const desc = minimalFixture();

    await withStaticServer(async (host) => {
      await withBrowserPage(async page => {
        await page.goto(`http://${host}/nocookiesite.html`);

        expect(() => desc.acceptAll(page)).to.throw;
      });
    });
  });

  it('Should properly encapsulate access to storageOptions field', () => {
    const descriptor = new SimpleCMPDescriptor(
      'TmpDescriptor',
      { cookies: ['seven'] },
      ['div#cmp-banner'],
      ['button#accept-all'],
    );

    // Initial state.
    const initialStorageOptions = descriptor.getStorageOptions();

    if ('cookies' in initialStorageOptions && Array.isArray(initialStorageOptions.cookies)) {
      expect(initialStorageOptions.cookies).to.have.length(1);
      expect(initialStorageOptions.cookies).to.include('seven');

      // Try to mess with the storageOptions field.
      initialStorageOptions.cookies.push('should not be here');

      // Check that the internal storageOptions field is unchanged.
      const laterStorageOptions = descriptor.getStorageOptions();

      if ('cookies' in laterStorageOptions && Array.isArray(laterStorageOptions.cookies)) {
        expect(laterStorageOptions.cookies).to.have.length(1);
        expect(laterStorageOptions.cookies).to.include('seven');
      } else {
        assert.fail('laterStorageOptions.cookies is missing or has incorrect type.');
      }
    } else {
      assert.fail('initialStorageOptions.cookies is missing or has incorrect type.');
    }
  });
});