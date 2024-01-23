import * as path from 'path';
import { readFileSync } from 'fs';

import Fastify from 'fastify';
import middie from '@fastify/middie';

import { authenticationMiddleware } from './middleware.mjs';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import { PORT, BACKEND_BASE } from '../config.mjs';
import { routes } from './routes.mjs';

import { API_DOMAIN } from '../../config.mjs';

// You must first generate certs for local development.
// Please see /src/services/.secrets/README.md for more information
const certsPath = path.join('src', 'services', '.secrets', 'certs');

const useHTTPs =
	BACKEND_BASE.startsWith('localhost')
	// eslint-disable-next-line no-process-env
	&& !process.env.GITHUB_ACTIONS;
const fastifyConfiguration = useHTTPs
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

/* midleware */
await fastify.register(middie);

// only authenticate annotate endpoints
fastify.use('/(s3|es)', authenticationMiddleware);

/* swagger */
await fastify.register(swagger, {
	swagger: {
	  info: {
			title: 'Nesta Annotation Service',
			description: 'DBpedia Spotlight Annotation service for large datasets.\n\nPlease refer to the <a href="https://github.com/nestauk/dap_dv_backends/tree/dev/src/services/annotation" target="_blank">docs</a> for a complete guide on how to use the service.',
			version: '0.1.0'
	  },
	  servers: [
			{
				url: API_DOMAIN,
				description: 'Default master node being served on AWS.'
			}
	  ],
	  securityDefinitions: {
			basicAuth: {
				type: 'basic',
				name: 'basicAuth',
				in: 'header'
			}
	  },
	  host: `${BACKEND_BASE}`,
	  schemes: ['https'],
	  consumes: ['application/json'],
	  produces: ['application/json'],
	}
});

await fastify.register(swaggerUI, {
	routePrefix: '/',
	uiConfig: {
	  docExpansion: 'list',
	  deepLinking: false,
	  defaultModelRendering: 'example',
	  layout: 'BaseLayout'
	},
});

/* routes */
fastify.register(routes);

const start = async () => {
	try {
		await fastify.listen({ host: '0.0.0.0', port: PORT });
		console.log(`Listening at localhost:${PORT}`);
		await fastify.ready();
		fastify.swagger();

	} catch (err) {
		fastify.log.error(err);
		throw new Error(err);
	}
};

start();


