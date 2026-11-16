import app from './app';
import { getDbPath, getPort } from './config';

const port = getPort();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`BookShop server listening on port ${port} (DB_PATH=${getDbPath()})`);
});
