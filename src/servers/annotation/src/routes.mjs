import { v4 as uuidv4 } from 'uuid';

import { arxliveCopy as DEFAULT_DOMAIN } from 'conf/config.mjs';
import { MAX_WORKERS, annotationEndpoint } from './config.mjs';
import { annotationService } from './machine.mjs';

export const routes = (fastify, options, done) => {

	fastify.get('/status', async (_, reply) => {
		const statusResponse = await getStatus();
		return reply.send(
			statusResponse
		);
	});

	fastify.post('/annotate/es', (request, reply) => {

		let {
			index,
			field,
			includeMetaData = true,
			domain = DEFAULT_DOMAIN,
			newField = 'dbpedia_entities',
			workers = MAX_WORKERS,
		} = request.body;

		// no more than 4 workers per process
		if (workers > MAX_WORKERS) {
			workers = MAX_WORKERS;
		}

		const id = uuidv4();

		annotationService.send(
			{
				id,
				workers,
				domain,
				index,
				field,
				newField,
				annotationEndpoint,
				includeMetaData,
				type: 'PROVISION',
			}
		);
		reply.send({ id });
	});

	done();
};
