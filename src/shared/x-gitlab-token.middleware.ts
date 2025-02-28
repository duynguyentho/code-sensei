import { NextFunction, Request, Response } from 'express';

export const handleSecretWebhook = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestToken = <string>req.headers['x-gitlab-token'];
  const webhookSecret = <string>process.env.GITLAB_WEBHOOK_SECRET;
  if (webhookSecret && requestToken !== webhookSecret) {
    return res.status(401).send('Invalid token');
  }

  next();
};
