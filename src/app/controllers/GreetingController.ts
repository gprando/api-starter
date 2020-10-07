import { Request, Response } from 'express';

export default function hello(request: Request, response: Response): void {
  const name = request.query.name || 'stranger';
  const message = `Hello, ${name}!`;
  response.json({
    message,
  });
}
