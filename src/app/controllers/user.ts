import { Request, Response, NextFunction } from 'express';

import UserService, { ErrorResponse } from '@root/app/services/user';

import writeJsonResponse from '@root/utils/express';
import logger from '@root/utils/logger';
// eslint-disable-next-line import/prefer-default-export
export function auth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const token = request.headers.authorization!;
  UserService.auth(token)
    .then(authResponse => {
      if (!(authResponse as any).error) {
        response.locals.auth = {
          userId: (authResponse as { userId: string }).userId,
        };
        next();
      } else {
        writeJsonResponse(response, 401, authResponse);
      }
    })
    .catch(() => {
      writeJsonResponse(response, 500, {
        error: {
          type: 'internal_server_error',
          message: 'Internal Server Error',
        },
      });
    });
}

export function createUser(request: Request, response: Response): void {
  const { email, password, name } = request.body;

  UserService.createUser(email, password, name)
    .then(resp => {
      if ((resp as any).error) {
        if ((resp as ErrorResponse).error.type === 'account_already_exists') {
          writeJsonResponse(response, 409, resp);
        } else {
          throw new Error(`unsupported ${resp}`);
        }
      } else {
        writeJsonResponse(response, 201, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(response, 500, {
        error: {
          type: 'internal_server_error',
          message: 'Internal Server Error',
        },
      });
    });
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body;

  UserService.Login(email, password)
    .then(resp => {
      if ((resp as any).error) {
        if ((resp as ErrorResponse).error.type === 'invalid_credentials') {
          writeJsonResponse(res, 404, resp);
        } else {
          throw new Error(`unsupported ${resp}`);
        }
      } else {
        const { userId, token, expireAt } = resp as {
          token: string;
          userId: string;
          expireAt: Date;
        };
        writeJsonResponse(
          res,
          200,
          { userId, token },
          { 'X-Expires-After': expireAt.toISOString() },
        );
      }
    })
    .catch((err: any) => {
      logger.error(`login: ${err}`);
      writeJsonResponse(res, 500, {
        error: {
          type: 'internal_server_error',
          message: 'Internal Server Error',
        },
      });
    });
}
