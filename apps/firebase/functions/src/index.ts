import { onRequest } from 'firebase-functions/v2/https';

export const health = onRequest((_request, response) => {
  response.status(200).send('Umbrella Firebase Functions is running.');
});
