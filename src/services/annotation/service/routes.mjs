import { v4 as uuidv4 } from 'uuid';

import { sendEmail } from 'aws/email.mjs';
import { bucketToIndex, indexToBucket } from 'aws/s3.mjs';
import { arxliveCopy as DEFAULT_DOMAIN } from 'conf/config.mjs';
import { count } from 'es/index.mjs';

import { MAX_WORKERS, internalAnnotationEndpoint } from '../config.mjs';
import { parseBasicAuth } from './auth.mjs';
import { annotationService } from './machine.mjs';
import { Progress } from './progress.mjs';
import { context } from './context.mjs';
import * as schema from './schemas.mjs';
import { parseS3URI } from './util.mjs';
import { checkS3, checkES } from './checks.mjs';


export const routes = (fastify, options, done) => {

	fastify.get('/status', { schema: schema.getStatusSchema }, async (_, reply) => {
		return reply.send(
			context
		);
	});

	fastify.get('/progress/:id', { schema: schema.getProgressSchema }, (request, reply) => {
		const { id } = request.params;
		if (id in context.progress) {
			reply.send(context.progress[id].status());
		}
		reply.code(404).send({error: 'no annotation with that id found.'});
	});

	fastify.get('/s3', { schema: schema.postAnnotateS3Schema }, async (request, reply) => {

		const domain = DEFAULT_DOMAIN;
		let {
			field,
			s3_input_uri,
			s3_output_uri,
			idField=null,
			output_format='array',
			output_processor='default',
			includeMetaData=true,
			newField='dbpedia_entities',
			workers=MAX_WORKERS,
		} = request.query;

		const { bucket: inBucket, key: inKey } = parseS3URI(s3_input_uri);
		const { bucket: outBucket, key: outKey } = parseS3URI(s3_output_uri);

		const checks = await checkS3(inBucket, inKey, outBucket, outKey);
		if (checks.error) {
			console.log("CHECKS: ", checks);
			return reply.code(400).send(checks);
		}

		const id = uuidv4();
		reply.send({ id });


		const { email } = parseBasicAuth(request.headers.authorization);

		const index = id;
		const total = await bucketToIndex(
			index,
			domain,
			inBucket,
			inKey,
			idField
		);

		const callback = () => {
			sendEmail(
				email,
				'annotations@dap-tools.uk',
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
		context.progress[id] = progress;

		// event send as input to src/node_modules/dbpedia/spotlight#annotateRequest
		annotationService.send(
			{
				id,
				workers,
				domain,
				index,
				field,
				newField,
				annotationEndpoint: internalAnnotationEndpoint,
				includeMetaData,
				progress,
				type: 'PROVISION',
			}
		);
	});

	fastify.get('/es', { schema: schema.postAnnotateEsSchema }, async (request, reply) => {

		let {
			index,
			field,
			includeMetaData = true,
			domain = DEFAULT_DOMAIN,
			newField = 'dbpedia_entities',
			workers = MAX_WORKERS,
		} = request.query;

		const checks = await checkES(domain, index, field);
		if (checks.error) {
			return reply.code(400).send(checks);
		}

		const { email } = parseBasicAuth(request.headers.authorization);

		const id = uuidv4();
		const total = await count(domain, index);
		const callback = () => {
			sendEmail(
				email,
				'annotations@dap-tools.uk',
				`Your annotation with id <code>${id}</code> has finished`,
				'Annotation finished.'
			);
		};
		const progress = new Progress(total, callback);
		context.progress[id] = progress;

		// event send as input to src/node_modules/dbpedia/spotlight#annotateRequest
		annotationService.send(
			{
				id,
				workers,
				domain,
				index,
				field,
				newField,
				annotationEndpoint: internalAnnotationEndpoint,
				includeMetaData,
				progress,
				type: 'PROVISION',
			}
		);
		reply.send({ id });
	});

	done();
};
