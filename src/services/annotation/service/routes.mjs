import { v4 as uuidv4 } from 'uuid';

import { sendEmail } from 'dap_dv_backends_utils/aws/email.mjs';
import { bucketToIndex, indexToBucket } from 'dap_dv_backends_utils/aws/s3.mjs';
import { count } from 'dap_dv_backends_utils/es/index.mjs';

import {
	ANNOTATIONS_EMAIL,
	dapAnnotationDomain as DEFAULT_DOMAIN,
	internalAnnotationEndpoint,
	MAX_WORKERS,
} from '../config.mjs';
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
		} else {
			reply.code(404).send({error: 'no annotation with that id found.'});
		}
	});

	fastify.get('/s3', { schema: schema.postAnnotateS3Schema }, async (request, reply) => {

		const domain = DEFAULT_DOMAIN;
		let {
			field,
			s3_input_uri,
			s3_output_uri,
			idField=null,
			output_format='array',
			output_processor='simple',
			includeMetaData=true,
			newField='dbpedia_entities',
			workers=MAX_WORKERS,
		} = request.query;

		const { bucket: inBucket, key: inKey } = parseS3URI(s3_input_uri);
		const { bucket: outBucket, key: outKey } = parseS3URI(s3_output_uri);

		const checks = await checkS3(inBucket, inKey, outBucket, outKey);
		if (checks.error) {
			return reply.code(400).send(checks);
		}

		const id = uuidv4();
		reply.send({ id });

		const { email } = parseBasicAuth(request.headers.authorization);

		const callback = () => {
			sendEmail(
				email,
				ANNOTATIONS_EMAIL,
				`Your annotation with id <code>${id}</code> has finished`,
				'Annotation finished.'
			);
			indexToBucket(
				id,
				domain,
				outBucket,
				outKey,
				{
					format: output_format,
					processor: output_processor
				}
			);
		};

		const progress = new Progress("calculating", callback);
		context.progress[id] = progress;

		const total = await bucketToIndex(
			id,
			domain,
			inBucket,
			inKey,
			{ idField, refresh: "wait_for" }
		);

		context.progress[id].setTotal(total);

		// event send as input to src/node_modules/dap_dv_backends_utils/dbpedia/spotlight.mjs#annotateRequest
		annotationService.send(
			{
				id,
				workers,
				domain,
				index: id,
				field,
				newField,
				annotationEndpoint: internalAnnotationEndpoint,
				includeMetaData,
				progress,
				type: 'PROVISION',
				groupSize: workers
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
				ANNOTATIONS_EMAIL,
				`Your annotation with id <code>${id}</code> has finished`,
				'Annotation finished.'
			);
		};

		const progress = new Progress(total, callback);
		context.progress[id] = progress;

		// event send as input to src/node_modules/dap_dv_backends_utils/dbpedia/spotlight.mjs#annotateRequest
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
				groupSize: workers
			}
		);
		reply.send({ id });
	});

	done();
};
