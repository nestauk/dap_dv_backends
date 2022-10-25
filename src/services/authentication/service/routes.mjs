import { doesTokenMatch, hashAndSaltToken } from './crypto.mjs';
import { sentTokenEmail } from './email.mjs';
import * as schema from './schemas.mjs';

// eslint-disable-next-line require-await
export const routes = async (fastify, options) => {

	fastify.post('/request', { schema: schema.postRequestAuthSchema }, (request, reply) => {
		const { email } = request.body;
		if (!email) {
			return reply.code(400).send('No email provided');
		}
		if (!email.endsWith('nesta.org.uk')) {
			return reply.code(400).send('Nesta email must be provided');
		}
		sentTokenEmail(email);
		reply.code(204).send();
	});

	fastify.get('/provide', { schema: schema.getProvideSchema }, (request, reply) => {
		const { token, email } = request.query;
		hashAndSaltToken(token, email);
		reply.send('All done. Your token should now work.');
	});

	fastify.post('/authenticate', { schema: schema.postAuthenticateSchema }, async (request, reply) => {
		const { token, email } = request.body;
		const authenticated = await doesTokenMatch(token, email);
		return reply.send(authenticated);
	});
};
