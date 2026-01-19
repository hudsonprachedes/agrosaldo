import express from 'express';
import { createApp } from '../backend/src/server.js';

let expressApp: express.Express | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function init() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      // Em alguns runtimes serverless, warnings de deprecation podem ser tratados
      // como erro e derrubar o processo. O Express 4 emite deprecation ao acessar
      // `app.router`, o que o NestJS faz internamente.
      // Garantimos que deprecations não interrompam a execução.
      (process as any).throwDeprecation = false;
      (process as any).traceDeprecation = false;
      (process as any).noDeprecation = true;

      expressApp = express();

      // Como o Nest está com bodyParser desabilitado (ver backend/src/server.ts),
      // registramos os parsers aqui para garantir que o req.body exista.
      expressApp.use(express.json({ limit: '2mb' }));
      expressApp.use(express.urlencoded({ extended: true }));

      await createApp(expressApp);
      isInitialized = true;
    })();
  }
  await initPromise;
}

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  await init();
  return (expressApp as express.Express)(req, res);
}
