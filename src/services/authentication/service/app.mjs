import { readFileSync } from 'fs';
import * as path from 'path';

import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { BACKEND_BASE, PORT } from '../config.mjs';
import { routes } from './routes.mjs';
import { __dirname } from './util.mjs';

// You must first generate certs for local development.
// Please see /src/services/.secrets/README.md for more information
const certsPath = path.join('src', 'services', '.secrets', 'certs');
const fastifyConfiguration = BACKEND_BASE.startsWith('localhost')
	? {
		https: {
			key: readFileSync(path.join(certsPath, 'key.pem')),
			cert: readFileSync(path.join(certsPath, 'cert.pem'))
	  }
	}
	: {};

const fastify = Fastify({
	...fastifyConfiguration,
	logger: true
});

await fastify.register(cors);

await fastify.register(swagger, {
	swagger: {
	  info: {
			title: 'Nesta Internal Authentication Service',
			description: 'Internal authentication service for providing api tokens to regestered Nesta emails.',
			version: '0.1.0'
	  },
	  host: BACKEND_BASE,
	  schemes: ['https'],
	  consumes: ['application/json'],
	  produces: ['application/json', 'text/plain'],
	}
});

await fastify.register(swaggerUI, {
	routePrefix: '/',
	uiConfig: {
	  docExpansion: 'list',
	  deepLinking: false,
	  defaultModelRendering: 'model',
	  layout: 'BaseLayout'
	},
});

fastify.register(routes);

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: PORT });
	} catch (err) {
		fastify.log.error(err);
		throw new Error(err);
	}
};
start();
