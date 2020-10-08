import bodyParser from 'body-parser';
import express, { Request, Response, NextFunction } from 'express';
import { Express } from 'express-serve-static-core';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import { OpenApiValidator } from 'express-openapi-validator';
import { connector, summarise } from 'swagger-routes-express';
import YAML from 'yamljs';

import * as api from '@root/app/controllers';
import expressDevLogger from '@root/utils/express_dev_logger';
import config from '@root/config';

export default async function createServer(): Promise<Express> {
  const yamlSpecFile = './config/openapi.yml';
  const apiDefinition = YAML.load(yamlSpecFile);
  const apiSummary = summarise(apiDefinition);

  console.info(apiSummary);

  const server = express();

  server.use(bodyParser.json());

  if (config.morganLogger) {
    server.use(
      morgan(':method :url :status :response-time ms - :res[content-length]'),
    );
  }

  if (config.morganBodyLogger) {
    morganBody(server);
  }

  if (config.exmplDevLogger) {
    server.use(expressDevLogger);
  }

  const validatorOptions = {
    coerceTypes: true,
    apiSpec: yamlSpecFile,
    validateRequests: true,
    validateRequesponses: true,
  };

  await new OpenApiValidator(validatorOptions).install(server);

  // error customization, if request is invalid
  server.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status).json({
      error: {
        type: 'request_validation',
        message: err.message,
        errors: err.errors,
      },
    });
  });

  const connect = connector(api, apiDefinition, {
    onCreateRoute: (method: string, descriptor: any[]) => {
      descriptor.shift();
      console.log(`${method}: ${descriptor[0]} : ${descriptor[1] as any} `);
    },
    security: {
      bearerAuth: api.auth,
    },
  });

  connect(server);

  return server;
}
