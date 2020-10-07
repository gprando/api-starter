import { Request, Response } from 'express';
import writeJsonResponse from '../../utils/express';

export function hello(request: Request, response: Response): void {
  const name = request.query.name || 'stranger';
  const message = `Hello, ${name}!`;
  response.json({
    message,
  });
}

export function goodbye(request: Request, response: Response): void {
  const { userId } = response.locals.auth;
  writeJsonResponse(response, 200, { message: `Goodbye, ${userId}!` });
}
