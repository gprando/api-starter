import express from 'express';
import { Express } from 'express-serve-static-core';

export default async function createServer(): Promise<Express> {
  const server = express();

  server.get('/', (request, response) => response.send('hellow world!!'));

  return server;
}
