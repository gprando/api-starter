import { Response } from 'express';
import { OutgoingHttpHeaders } from 'http';

export default function writeJsonResponse(
  response: Response,
  code: any,
  payload: any,
  headers?: OutgoingHttpHeaders | undefined,
): void {
  const data =
    typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;
  response.writeHead(code, { ...headers, 'Content-Type': 'application/json' });
  response.end(data);
}
