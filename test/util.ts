import path from 'path';
import fsSync, { promises as fs } from 'fs';
import { launch } from 'puppeteer';
import type {
    PuppeteerLaunchOptions,
    LaunchOptions,
    Browser,
    Page,
    BrowserLaunchArgumentOptions,
    BrowserConnectOptions,
  } from 'puppeteer';
import http from 'http';
import { consola } from 'consola';

/**
 * Wrapper around puppeteer.launch() that tries to detect the browser to use, in
 * case of containerized environments and the like.
 * @param launchOpts Additional launch options. These *will* overwrite any
 * sane defaults that the function tries to pull in (like Chrome bin paths).
 * @returns 
 */
export async function launchBrowser(launchOpts?: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions): Promise<Browser> {
  return await launch(buildLaunchOptions(launchOpts));
}

export function buildLaunchOptions(launchOpts?: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions): LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions {
  const finalOptions = {
    
    headless: (process.env.INQLUDEIT_CMP_PUPPETEER_HEADLESS
      ? process.env.INQLUDEIT_CMP_PUPPETEER_HEADLESS === 'true'
      : false) || true,
    args: (process.env.INQLUDEIT_CMP_PUPPETEER_ARGS
      ? process.env.INQLUDEIT_CMP_PUPPETEER_ARGS.split(',')
      : []),
    ... launchOpts,
  };

  if (process.env.INQLUDEIT_CMP_PUPPETEER_EXECUTABLE_PATH || launchOpts?.executablePath) {
    finalOptions.executablePath = process.env.INQLUDEIT_CMP_PUPPETEER_EXECUTABLE_PATH || launchOpts?.executablePath;
  } else {
    // Fallback in case *no* executable information is present. Might break on
    // deployments.
    finalOptions.channel = 'chrome';
  }

  return finalOptions;
}

/**
 * Helper function to return the absolute path to a fixture.
 */
export function fixturePath(filename: string): string {
  const p = path.join(__dirname, 'fixtures', filename);

  if (fsSync.statSync(p).isFile() || fsSync.statSync(p).isDirectory() || fsSync.statSync(p).isSymbolicLink()) {
    return p;
  } else {
    throw new Error(`BAD TEST. The file ${filename} isn't present in the fixtures directory.`);
  }
}

/**
 * Reads a file as text and returns its contents.
 * @param filename The file's name, in the fixtures directory.
 */
export function readFixtureFileSync(filename: string, encoding: BufferEncoding = 'utf-8'): string {
  return fsSync.readFileSync(fixturePath(filename), encoding);
}

export async function readFixtureFile(filename: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  return fs.readFile(fixturePath(filename), encoding);
}

/**
 * Launches a new puppeteer instance, opens a page object, and passes the page
 * to a callback.
 * @param callback Function to call with a new page object.
 * @returns Returns whatever the callback returns.
 */
export async function withBrowserPage<T>(callback: (page: Page) => Promise<T>, launchOpts?: LaunchOptions): Promise<T> {
  const browser = await launchBrowser(launchOpts);
  const page = await browser.newPage();

  try {
    return await callback(page);
  } finally {
    await page?.close();
    await browser?.close();
  }
}

export async function startStaticServer(cb?: (server: http.Server) => unknown, port?: number): Promise<http.Server> {
  const server = http.createServer(async (req, res) => {
    fsSync.readFile(__dirname + '/fixtures' + req.url, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  });
  
  server.listen(port, async () => {
    consola.debug('Static server is up');
    // Server started.
    if (cb) await cb(server);
  });

  return server;
}

export async function withStaticServer(cb: (host: string, server: http.Server) => Promise<unknown>): Promise<void> {
  const server = http.createServer(async (req, res) => {
    fsSync.readFile(__dirname + '/fixtures' + req.url, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(() => {
      consola.debug('Static server is up');

      const addr = server.address();
      if (addr === null)
        throw new Error('Server reported no address!');

      const host = typeof addr === 'string' ? addr : `localhost:${addr.port}`;

      // Server started.
      cb(host, server)
        .then(() => resolve())
        .catch((reason) => reject(reason))
        .finally(() => {
          server.close();
        });
    });
  });
}

export async function withStaticPage(filePath: string, cb: (page:Page) => Promise<unknown>, options?: { port?: number, puppeteer?: LaunchOptions }): Promise<void> {
  let port = options?.port || 0;

  const server = http.createServer((req, res) => {
    fsSync.readFile(path.join(path.dirname(filePath), req.url || ''), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  });

  const findAvailablePort = port === 0;

  if (findAvailablePort) {
    port = 8080;
    let foundPort = false;

    while (foundPort === false) {
      try {
        server.listen(port);
        foundPort = true;
      } catch (err: unknown) {
        consola.debug(`Port ${port} taken. Trying next one up.`);
        port++;
      }
    }
  }

  await withBrowserPage(async page => {
    await page.goto(`http://localhost:${port}/${path.basename(filePath)}`);

    await cb(page);
  }, options?.puppeteer);

  server.close();
}
