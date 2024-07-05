import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { api } from './modules/gitlab/utils/gitlab-api';
import { Request, Response, NextFunction } from 'express';

const handleSecretWebhook = (req: Request, res: Response, next: NextFunction) => {
  const requestToken = <string>req.headers['x-gitlab-token'];
  const webhookSecret = <string>process.env.GITLAB_WEBHOOK_SECRET || '';
  if (webhookSecret && requestToken !== webhookSecret) {
    return res.status(401).send('Invalid token');
  }

  next();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
  });
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use(handleSecretWebhook);

  await app.listen(process.env.PORT || 3000);
  await testConnection();
}

async function testConnection() {
  const logger = new Logger(testConnection.name);
  logger.log('Testing connection to GitLab', testConnection.name);

  try {
    const user = await api.Users.current();
    console.log(
      'Connected to GitLab successfully. Current user:',
      user.username,
    );
    return true;
  } catch (error) {
    console.error('Failed to connect to GitLab:', error);
    return false;
  }
}

bootstrap();
