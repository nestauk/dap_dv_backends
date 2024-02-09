import { AUTH_EMAIL_DOMAIN } from '../../config.mjs';
import { doesTokenMatch, activateEmailToken } from './crypto.mjs';
import { sendTokenEmail } from './email.mjs';
import * as schema from './schemas.mjs';

// eslint-disable-next-line require-await
export const routes = async (fastify, options) => {

	fastify.get('/request', { schema: schema.getRequestAuthSchema }, (request, reply) => {
		const { email } = request.query;
		if (!email) {
			return reply.code(400).send('No email provided');
		}
		if (!email.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) {
			return reply.code(400).send('Valid email must be provided');
		}
		sendTokenEmail(email);
		reply.code(204).send();
	});

	fastify.get('/activate', { schema: schema.getActivateSchema }, async (request, reply) => {
		const { email, token } = request.query;
		const wasActivated = await activateEmailToken(email, token);
		const message = wasActivated
			? 'All done. Your token should now work.'
			: 'Something went wrong. Please try again.';
		reply.send(message);
	});

	fastify.get('/authenticate', { schema: schema.getAuthenticateSchema }, async (request, reply) => {
		const { token, email } = request.query;
		const authenticated = await doesTokenMatch(token, email);
		return reply.send(authenticated);
	});
};
