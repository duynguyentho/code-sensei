import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { Logger } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/node';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
  });
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use((req: any, res: any, next: any) => {
    const requestToken = req.headers['x-gitlab-token'];
    const webhookSecret = process.env.GITLAB_WEBHOOK_SECRET;
    if (webhookSecret && (requestToken !== webhookSecret)) {
      return res.status(401).send('Invalid token');
    }

    next();
  });

  const logger = new Logger(bootstrap.name);
  await app.listen(process.env.PORT || 3000);
  await testConnection();
}

export const api = new Gitlab({
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_ACCESS_TOKEN || '',
  rejectUnauthorized: false,
});

async function testConnection() {
  const logger = new Logger(testConnection.name);
  logger.log('Testing connection to GitLab', testConnection.name);

  try {
    const user = await api.Users.current();
    console.log(
      'Connected to GitLab successfully. Current user:',
      user.username
    );
    return true;
  } catch (error) {
    console.error('Failed to connect to GitLab:', error);
    return false;
  }
}
bootstrap();
