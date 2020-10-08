import request from 'supertest';
import { Express } from 'express-serve-static-core';
import faker from 'faker';
import jwt, { Secret, SignCallback, SignOptions } from 'jsonwebtoken';

import db from '@root/utils/db';
import { createDummy } from '@root/__tests__/user';

import UserService from '@root/app/services/user';
import createServer from '@root/utils/server';

jest.mock('@root/app/services/user');

let server: Express;
beforeAll(async () => {
  server = await createServer();
});

beforeAll(async () => {
  await db.open();
});

afterAll(async () => {
  await db.close();
});

describe('auth failure', () => {
  it('should return 500 & valid response if auth rejects with an error', async done => {
    (UserService.auth as jest.Mock).mockRejectedValue(new Error());
    request(server)
      .get(`/api/v1/goodbye`)
      .set('Authorization', 'Bearer fakeToken')
      .expect(500)
      // eslint-disable-next-line consistent-return
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toMatchObject({
          error: {
            type: 'internal_server_error',
            message: 'Internal Server Error',
          },
        });
        done();
      });
  });
});

describe('createUser failure', () => {
  it('should return 500 & valid response if auth rejects with an error', async done => {
    (UserService.createUser as jest.Mock).mockResolvedValue({
      error: { type: 'unkonwn' },
    });
    request(server)
      .post(`/api/v1/user`)
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.name.firstName(),
      })
      .expect(500)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toMatchObject({
          error: {
            type: 'internal_server_error',
            message: 'Internal Server Error',
          },
        });
        done();
      });
  });
});

describe('login', () => {
  it('should return internal_server_error if jwt.sign fails with the error', async () => {
    (jwt.sign as any) = (
      payload: string | Buffer | object,
      secretOrPrivateKey: Secret,
      options: SignOptions,
      callback: SignCallback,
    ) => {
      callback(new Error('failure'), undefined);
    };

    const dummy = await createDummy();
    await expect(
      UserService.Login(dummy.email, dummy.password),
    ).rejects.toEqual({
      error: {
        type: 'internal_server_error',
        message: 'Internal Server Error',
      },
    });
  });
});
