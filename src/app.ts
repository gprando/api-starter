import createServer from './utils/server';

createServer()
  .then(server =>
    server.listen(3333, () =>
      console.info(`Listening on http://localhost:3333`),
    ),
  )
  .catch(err => console.error(`Error: ${err}`));
