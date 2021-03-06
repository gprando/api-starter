import faker from 'faker';

import db from '@root/utils/db';
import { createDummy, createDummyAndAuthorize } from '@root/__tests__/user';
import user from '../user';

beforeAll(async () => {
  await db.open();
});

afterAll(async () => {
  await db.close();
});

describe('auth', () => {
  it('should resolve with true and valid userId for hardcoded token', async () => {
    const dummy = await createDummyAndAuthorize();
    await expect(user.auth(dummy.token)).resolves.toEqual({
      userId: dummy.userId,
    });
  });

  it('should resolve with false for invalid token', async () => {
    const response = await user.auth('invalidToken');
    expect(response).toEqual({
      error: { type: 'unauthorized', message: 'Authentication Failed' },
    });
  });
});

describe('createUser', () => {
  it('should resolve with true and valid userId', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const name = faker.name.firstName();

    await expect(user.createUser(email, password, name)).resolves.toEqual({
      userId: expect.stringMatching(/^[a-f0-9]{24}$/),
    });
  });

  it('should resolves with false & valid error if duplicate', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const name = faker.name.firstName();

    await user.createUser(email, password, name);

    await expect(user.createUser(email, password, name)).resolves.toEqual({
      error: {
        type: 'account_already_exists',
        message: `${email} already exists`,
      },
    });
  });

  it('should reject if invalid input', async () => {
    const email = 'invalid@em.c';
    const password = faker.internet.password();
    const name = faker.name.firstName();

    await expect(
      user.createUser('em@em.c', password, name),
    ).rejects.toThrowError('validation failed');
  });
});

describe('login', () => {
  it('should return JWT token, userId, expireAt to a valid login/password', async () => {
    const dummy = await createDummy();
    await expect(user.Login(dummy.email, dummy.password)).resolves.toEqual({
      userId: dummy.userId,
      token: expect.stringMatching(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      ),
      expireAt: expect.any(Date),
    });
  });

  it('should reject with error if login does not exist', async () => {
    await expect(
      user.Login(faker.internet.email(), faker.internet.password()),
    ).resolves.toEqual({
      error: { type: 'invalid_credentials', message: 'Invalid Login/Password' },
    });
  });

  it('should reject with error if password is wrong', async () => {
    const dummy = await createDummy();
    await expect(
      user.Login(dummy.email, faker.internet.password()),
    ).resolves.toEqual({
      error: { type: 'invalid_credentials', message: 'Invalid Login/Password' },
    });
  });
});
