import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { Gitlab } from '@gitbeaker/node';

console.log(process.env.GITLAB_ACCESS_TOKEN);
export const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: <string>process.env.GITLAB_ACCESS_TOKEN,
  rejectUnauthorized: false,
});
