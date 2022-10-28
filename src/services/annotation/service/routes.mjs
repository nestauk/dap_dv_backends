import { v4 as uuidv4 } from 'uuid';

import { sendEmail } from 'aws/email.mjs';
import { bucketToIndex, indexToBucket } from 'aws/s3.mjs';
import { arxliveCopy as DEFAULT_DOMAIN } from 'conf/config.mjs';
import { count } from 'es/index.mjs';

import { parseBasicAuth } from './auth.mjs';
import { checkS3, checkES } from './checks.mjs';
import { MAX_WORKERS, annotationEndpoint, notificationEmail } from '../config.mjs';
import { annotationService } from './machine.mjs';
import { Progress } from './progress.mjs';
import { state } from './state.mjs';
import { parseS3URI } from './util.mjs';


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

	// eslint-disable-next-line consistent-return
	fastify.post('/annotate/s3', async (request, reply) => {

		const domain = DEFAULT_DOMAIN;
		let {
			field,
			s3_input_uri,
			s3_output_uri,
			idField=null,
			includeMetaData=true,
			newField='dbpedia_entities',
			workers=MAX_WORKERS,
			output_format='array',
			output_processor='default',
			batchSize=10,
		} = request.body;

		const { bucket: inBucket, key: inKey } = parseS3URI(s3_input_uri);
		const { bucket: outBucket, key: outKey } = parseS3URI(s3_output_uri);

		const checks = await checkS3(inBucket, inKey, outBucket, outKey);
		if (checks.error) {
			return reply.send(checks);
		}

		const id = uuidv4();
		reply.send({ id });

		const { email } = parseBasicAuth(request.headers.authorization);

		// const index = uriToEsIndex(s3_input_uri);
		const index = id;
		await bucketToIndex(
			index,
			domain,
			inBucket,
			inKey,
			idField
		);

		// should there be a delay between above?
		const total = await count(domain, index);
		const callback = () => {
			sendEmail(
				email,
				notificationEmail,
				`Your annotation with id <code>${id}</code> has finished`,
				'Annotation finished.'
			);
			indexToBucket(
				index,
				domain,
				outBucket,
				outKey,
				{
					format: output_format,
					processor: output_processor
				}
			);
		};

		const progress = new Progress(total, callback);
		state.progress[id] = progress;

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
				batchSize,
				type: 'PROVISION',
			}
		);
	});

	// eslint-disable-next-line consistent-return
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

		const checks = await checkES(domain, index, field);
		if (checks.error) {
			return reply.send(checks);
		}

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
