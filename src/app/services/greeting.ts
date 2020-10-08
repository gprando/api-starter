import User, { IUser } from '@root/app/models/user';
import cacheLocal from '@root/utils/cache_local';
import logger from '@root/utils/logger';

async function goodbye(userId: string): Promise<{ message: string }> {
  try {
    let user: IUser | undefined | null = cacheLocal.get<IUser>(userId);
    if (!user) {
      user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found`);
      }

      cacheLocal.set(userId, user);
    }

    return { message: `Goodbye, ${user.name}!` };
  } catch (err) {
    logger.error(`goodbye: ${err}`);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({
      error: {
        type: 'internal_server_error',
        message: 'Internal Server Error',
      },
    });
  }
}

export default { goodbye };
