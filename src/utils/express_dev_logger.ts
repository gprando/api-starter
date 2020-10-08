/* eslint-disable prefer-rest-params */
import { Request, Response, NextFunction } from 'express';

export default (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const startHrTime = process.hrtime();

  console.log(
    `Request: ${request.method} ${
      request.url
    } at ${new Date().toUTCString()}, User-Agent: ${request.get('User-Agent')}`,
  );

  console.log(`Request Body: ${JSON.stringify(request.body)}`);

  const [oldWrite, oldEnd] = [response.write, response.end];

  const chunks: Buffer[] = [];

  (response.write as unknown) = function (chunk: any): void {
    chunks.push(Buffer.from(chunk));
    (oldWrite as Function).apply(response, arguments);
  };

  response.end = function (chunk: any): void {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

    console.log(
      `Response ${response.statusCode} ${elapsedTimeInMs.toFixed(3)} ms`,
    );

    const body = Buffer.concat(chunks).toString('utf8');
    console.log(`Response Body: ${body}`);
    (oldEnd as Function).apply(response, arguments);
  };

  next();
};
