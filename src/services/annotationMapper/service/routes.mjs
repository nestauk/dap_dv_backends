import * as _ from 'lamb';

import { annotateText } from 'dap_dv_backends_utils/dbpedia/spotlight.mjs';

import { DOCKER_ANNOTATION_NODE_ENDPOINT } from '../config.mjs';


export const routes = (fastify, options, done) => {

	fastify.post('/annotate', async (request, reply) => {
		const { texts, includeMetaData=true } = request.body;
		const promises = _.map(
			texts,
			t => annotateText(t, {
				includeMetaData,
				endpoint: DOCKER_ANNOTATION_NODE_ENDPOINT
			}));

		const results = await Promise.allSettled(promises);
		const annotations = _.map(
			results,
			r => r.status === 'fulfilled' ? r.value : { annotations: [] }
		);
		reply.send(annotations);
	});

	done();
};
