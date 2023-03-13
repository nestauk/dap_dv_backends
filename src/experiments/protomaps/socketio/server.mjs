import fastify from "fastify";
import cors from '@fastify/cors';
import fastifyIO from "fastify-socket.io";
import * as _ from 'lamb';

const server = fastify();

await server.register(cors, {
	origin: "*"
});
await server.register(fastifyIO, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

server.get("/", (req, reply) => {
	console.log("connected");
	server.io.on("mapmove", data => {
		console.log("mapmovve");
		console.log(data);
	});
});

const start = async () => {
	try {
		await server.listen({ host: '0.0.0.0', port: 3000 });
		server.io.on("connection", socket => {
			socket.on("mapmove", ids => {
				const min = Math.min(...ids);
				const max = Math.max(...ids);
				const scale = _.map(
					ids,
					id => (id - min) / (max - min)
				);
				server.io.emit("data", scale);
			});
		});

	} catch (err) {
		server.log.error(err);
		throw new Error(err);
	}
};

start();
