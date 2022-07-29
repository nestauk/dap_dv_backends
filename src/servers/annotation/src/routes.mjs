import { v4 as uuidv4 } from 'uuid';
import { state } from './state.mjs';
import { getStatus } from './util.mjs';

export const routes = (fastify, options, done) => {

	fastify.get('/status', async (_, reply) => {
		const statusResponse = await getStatus();
		return reply.send(
			statusResponse
		);
	});

	fastify.post('/annotate/es', (request, reply) => {
		const { index, workers=4 } = request.body;
		const id = uuidv4();
		state.waiting = [...state.waiting, { index, workers, id }];
		reply.send({ id });
	});

	done();
};
