// import { SeverityLevel } from '@/review/review-comment';
// import express from 'express';
// import { toNumber } from 'lodash';
// import { GITLAB_WEBHOOK_SECRET, PORT } from '../config/env';
// import { api } from './gitlab-api';
// import { reviewMergeRequest } from './merge-request';
//
// export function createWebhookApp() {
//   const app = express();
//   app.use(express.json());
//
//   // Middleware to verify webhook secret
//   const webhookSecret = GITLAB_WEBHOOK_SECRET;
//   if (webhookSecret) {
//     app.use((req, res, next) => {
//       const requestToken = req.headers['x-gitlab-token'];
//
//       if (requestToken !== webhookSecret) {
//         return res.status(401).send('Invalid token');
//       }
//
//       next();
//     });
//   }
//
//   app.post('/webhook', handleWebhookRequest);
//   app.listen(toNumber(PORT), '0.0.0.0', () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
//   return app;
// }
//
// // async function handleWebhookRequest(
// //   req: express.Request,
// //   res: express.Response,
// // ) {
// //   const data = req.body;
// //   console.log('Received webhook:', data.object_kind, data.object_attributes.noteable_type);
// //
// //   if (
// //     data.object_kind === 'note' &&
// //     data.object_attributes.noteable_type === 'MergeRequest'
// //   ) {
// //     const commentBody = data.object_attributes.note;
// //
// //     console.log('====================================');
// //     console.log(commentBody);
// //     console.log('====================================');
// //
// //     handleMergeRequestComment(commentBody, data);
// //   }
//
//   // Always send a 200 OK response immediately,
//   // as the review may take a while and we don't want to keep the webhook connection open.
//   res.sendStatus(200);
// }
//
// async function handleMergeRequestComment(commentBody: any, data: any) {
//   const currentUser = await api.Users.current();
//   console.log('====================================');
//   console.log('currentuser', currentUser);
//   console.log('====================================');
//   const mentionsCurrentUser = commentBody.includes('@' + currentUser.username);
//   console.log('mentionsCurrentUser', mentionsCurrentUser);
//   const asksForReview = commentBody.toLowerCase().includes('review');
//   console.log('asksForReview', asksForReview);
//
//   let severity: SeverityLevel | null = null;
//   const severityLevels: SeverityLevel[] = ['low', 'medium', 'high'];
//
//   for (const severityLevel of severityLevels) {
//     if (commentBody.includes(severityLevel)) {
//       severity = severityLevel;
//     }
//   }
//
//   if (mentionsCurrentUser && asksForReview && severity) {
//     const projectId = data.project_id;
//     const mergeRequestId = data.merge_request.iid;
//
//     // Call the review function asynchronously
//     reviewMergeRequest(projectId, mergeRequestId, severity).catch(error => {
//       console.error(
//         `Error reviewing merge request ${mergeRequestId} of project ${projectId}:`,
//         error,
//       );
//     });
//   }
// }
