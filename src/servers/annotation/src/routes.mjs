import { v4 as uuidv4 } from 'uuid';

import { MAX_WORKERS } from './config.mjs';
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

		let { domain, index, field, workers=MAX_WORKERS } = request.body;

		// no more than 4 workers per process
		if (workers > MAX_WORKERS) {
			workers = MAX_WORKERS;
		}
		const id = uuidv4();
		state.waiting = [...state.waiting, { domain, index, field, workers, id }];
		reply.send({ id });
	});

	done();
};
