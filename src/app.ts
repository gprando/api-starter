import logger from './utils/logger';
import createServer from './utils/server';
import db from './utils/db';

const init = async () => {
  await db.open();

  const server = await createServer();

  server.listen(3000, () => {
    logger.info(`Listening on http://localhost:3000`);
  });
};

init();
