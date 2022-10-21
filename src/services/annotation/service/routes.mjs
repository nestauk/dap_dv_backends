import { v4 as uuidv4 } from 'uuid';

import { arxliveCopy as DEFAULT_DOMAIN } from 'conf/config.mjs';
import { count } from 'es/index.mjs';

import { MAX_WORKERS, annotationEndpoint } from '../config.mjs';
import { annotationService } from './machine.mjs';
import { Progress } from './progress.mjs';
import { state } from './state.mjs';


export const routes = (fastify, options, done) => {

	fastify.get('/status', async (_, reply) => {
		const statusResponse = await getStatus();
		return reply.send(
			statusResponse
		);
	});

	fastify.get('/progress/:id', (request, reply) => {
		const { id } = request.params;
		if (id in state.progress) {
			reply.send(state.progress[id].status());
		}
		reply.code(404).send({error: 'no annotation with that id found.'});
	});

	fastify.post('/annotate/es', async (request, reply) => {

		let {
			index,
			field,
			email,
			includeMetaData = true,
			domain = DEFAULT_DOMAIN,
			newField = 'dbpedia_entities',
			workers = MAX_WORKERS,
		} = request.body;

		const id = uuidv4();
		const total = await count(domain, index);
		const progress = new Progress(total, email, id);
		state.progress[id] = progress;

		// no more than 4 workers per process
		if (workers > MAX_WORKERS) {
			workers = MAX_WORKERS;
		}

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
				progress,
				type: 'PROVISION',
			}
		);
		reply.send({ id });
	});

	done();
};
