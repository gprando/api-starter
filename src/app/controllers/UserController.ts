/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express';

import writeJsonResponse from '@root/utils/express';
import UserService from '@root/app/services/user';

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
