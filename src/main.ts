import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { api } from './shared/gitlab-api';
import { handleSecretWebhook } from './shared/x-gitlab-token.middleware';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: true,
  });
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use(handleSecretWebhook);

  await app.listen(configService.get<number>('PORT') || 3001);
  await testConnection();
}

async function testConnection() {
  const logger = new Logger(testConnection.name);
  logger.debug('Testing connection to GitLab');

  try {
    const user = await api.Users.current();
    console.log(
      'Connected to GitLab successfully. Current user:',
      user.username,
    );

    return true;
  } catch (error) {
    logger.error('Failed to connect to GitLab:', error);
    return false;
  }
}

bootstrap();
