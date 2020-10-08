import fs from 'fs';
import jwt, { SignOptions, VerifyErrors, VerifyOptions } from 'jsonwebtoken';

import User, { IUser } from '@root/app/models/user';
import config from '@root/config';
import cacheLocal from '@root/utils/cache_local';

import logger from '@root/utils/logger';

export type ErrorResponse = { error: { type: string; message: string } };
export type CreateUserResponse = ErrorResponse | { userId: string };
export type AuthResponse = ErrorResponse | { userId: string };
export type LoginUserResponse =
  | ErrorResponse
  | { token: string; userId: string; expireAt: Date };

const privateKey = fs.readFileSync(config.privateKeyFile);
const privateSecret = {
  key: privateKey,
  passphrase: config.privateKeyPassphrase,
};
const signOptions: SignOptions = {
  algorithm: 'RS256',
  expiresIn: '14d',
};

const publicKey = fs.readFileSync(config.publicKeyFile);
const verifyOptions: VerifyOptions = {
  algorithms: ['RS256'],
};

function auth(bearerToken: string): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const token = bearerToken.replace('Bearer ', '');
    jwt.verify(
      token,
      publicKey,
      verifyOptions,
      (err: VerifyErrors | null, decoded: object | undefined) => {
        if (err === null && decoded !== undefined) {
          const d = decoded as { userId?: string; exp: number };
          if (d.userId) {
            resolve({ userId: d.userId });
            return;
          }
        }
        resolve({
          error: { type: 'unauthorized', message: 'Authentication Failed' },
        });
      },
    );
  });
}

const createUser = (
  email: string,
  password: string,
  name: string,
): Promise<CreateUserResponse> => {
  return new Promise((resolve, reject) => {
    const user = new User({ email, password, name });

    user
      .save()
      .then(u => {
        resolve({ userId: u._id.toString() });
      })
      .catch(err => {
        if (err.code === 11000) {
          resolve({
            error: {
              type: 'account_already_exists',
              message: `${email} already exists`,
            },
          });
        } else {
          logger.error(`createUser: ${err}`);
          reject(err);
        }
      });
  });
};

function createAuthToken(
  userId: string,
): Promise<{ token: string; expireAt: Date }> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId },
      privateSecret,
      signOptions,
      (err: Error | null, encoded: string | undefined) => {
        if (err === null && encoded !== undefined) {
          const expireAfter = 2 * 604800; /* two weeks */
          const expireAt = new Date();
          expireAt.setSeconds(expireAt.getSeconds() + expireAfter);

          resolve({ token: encoded, expireAt });
        } else {
          reject(err);
        }
      },
    );
  });
}

async function Login(
  login: string,
  password: string,
): Promise<LoginUserResponse | undefined> {
  try {
    // const user = await User.findOne({email: login})
    // if (!user) {
    //  return {error: {type: 'invalid_credentials', message: 'Invalid Login/Password'}}
    // }
    let user: IUser | undefined | null = cacheLocal.get<IUser>(login);
    if (!user) {
      user = await User.findOne({ email: login });
      if (!user) {
        return {
          error: {
            type: 'invalid_credentials',
            message: 'Invalid Login/Password',
          },
        };
      }

      cacheLocal.set(user._id.toString(), user);
      cacheLocal.set(login, user);
    }
  } catch (err) {
    logger.error(`login: ${err}`);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({
      error: {
        type: 'internal_server_error',
        message: 'Internal Server Error',
      },
    });
  }
}

export default { auth, createAuthToken, Login, createUser };
