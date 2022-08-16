import Fastify from 'fastify';

import { PORT } from './config.mjs';
import { routes } from './routes.mjs';

const fastify = Fastify({
	logger: true
});

fastify.register(routes);

const start = async () => {
	try {
		await fastify.listen({ port: PORT });
		console.log(`Listening at http://localhost:${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		throw new Error(err);
	}
};

start();
