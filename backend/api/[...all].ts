import express from 'express';
import { createApp } from '../src/server';

let expressApp: express.Express | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function init() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      expressApp = express();
      await createApp(expressApp);
      isInitialized = true;
    })();
  }
  await initPromise;
}

export default async function handler(req: express.Request, res: express.Response) {
  await init();
  return (expressApp as express.Express)(req, res);
}
