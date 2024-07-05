import { Gitlab } from '@gitbeaker/node';
import * as process from 'process';

export const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_ACCESS_TOKEN,
  rejectUnauthorized: false,
})
