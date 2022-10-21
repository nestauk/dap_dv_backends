import Fastify from 'fastify';

import { PORT } from '../config.mjs';
import { routes } from './routes.mjs';
import { __dirname } from './util.mjs';

const fastify = Fastify({
	logger: false
});

fastify.register(routes);

const start = async () => {
	try {
		await fastify.listen({ port: PORT });
	} catch (err) {
		fastify.log.error(err);
		throw new Error(err);
	}
};
start();
