import Fastify from 'fastify';
import middie from '@fastify/middie';

import { PORT } from '../config.mjs';
import { authenticationMiddleware } from './middleware.mjs';
import { routes } from './routes.mjs';

const fastify = Fastify({
	logger: true
});

/* midleware */
await fastify.register(middie);

// only authenticate annotate endpoints
fastify.use('/annotate/(.*)', authenticationMiddleware);

/* routes */
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
