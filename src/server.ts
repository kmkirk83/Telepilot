import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(JSON.stringify({ level: 'info', message: 'server started', port: env.PORT }));
});
