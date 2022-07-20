import { statusEndpoint, annotationEndpoint } from './config.mjs';
import { testSpotlightEnpoint } from './util.mjs';

export const routes = (fastify, options, done) => {

	fastify.get('/status', async (_, reply) => {
		const response = await fetch(statusEndpoint, {
			method: 'GET'
		});
		const statusResponse = await response.json();
		if (statusResponse.status === 'up') {
			statusResponse.status = testSpotlightEnpoint(annotationEndpoint)
				? 'ready'
				: 'scheduling';
		}
		return reply.send(
			statusResponse
		);
	});

	done();
};
