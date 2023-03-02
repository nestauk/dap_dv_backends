import cors from '@fastify/cors';
import Fastify from 'fastify';
import * as _ from 'lamb';

const fastify = Fastify({
	logger: false
});

await fastify.register(cors, { origin: true });

fastify.post('/', (request, reply) => {
	const ids = request.body;
	const min = Math.min(...ids);
	const max = Math.max(...ids);
	const scale = _.map(
		ids,
		id => (id - min) / (max - min)
	);
	reply.send(scale);
});

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: 3000 });
	} catch (err) {
		fastify.log.error(err);
		throw new Error(err);
	}
};

start();
