import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import apiRouter from './routes';
import { CLIENT_DIST } from './config';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const rawStatus = (err && (err.status ?? err.statusCode)) as number | undefined;
  const status = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
  const message = status === 500 ? 'Internal server error' : (err && err.message) || 'Request failed';
  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: message });
};

export function createApp(clientDist: string = CLIENT_DIST): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  const indexFile = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexFile)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      res.sendFile(indexFile);
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);
  return app;
}

const app = createApp();

export default app;
