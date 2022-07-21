import { doesTokenMatch, hashAndSaltToken } from './crypto.mjs';
import { sentTokenEmail } from './email.mjs';

// eslint-disable-next-line require-await
export const routes = async (fastify, options) => {

	fastify.post('/request', (request, reply) => {
		const { email } = request.body;
		if (!email) {
			return reply.code(400).send('No email provided');
		}
		if (!email.endsWith('nesta.org.uk')) {
			return reply.code(400).send('Nesta email must be provided');
		}
		sentTokenEmail(email);
		reply.send();
	});

	fastify.get('/provide', (request, reply) => {
		const { token, email } = request.query;
		hashAndSaltToken(token, email);
		reply.send('All done. Your token should now work.');
	});

	fastify.post('/authenticate', async (request, reply) => {
		const { token, email } = request.body;
		const authenticated = await doesTokenMatch(token, email);
		return reply.send(authenticated);
	});
};
