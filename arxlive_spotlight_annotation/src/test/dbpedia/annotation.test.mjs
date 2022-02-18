import * as assert from 'assert';
import * as fs from 'fs/promises';

import {
	annotateDocument,
	uploadAnnotatedDocument,
} from 'dbpedia/spotlight.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs';
import { update } from 'es/update.mjs';
import { get } from 'es/document.mjs';
import { arxliveCopy } from 'conf/config.mjs';

describe('spotlight', () => {
	const annotationField = 'textBody_abstract_article';
	let dummyDocuments, annotatedDummyDocuments;
	before(async function () {
		dummyDocuments = JSON.parse(
			await fs.readFile(
				'src/test/data/elastic_search_results/test_index.json'
			)
		);
		annotatedDummyDocuments = JSON.parse(
			await fs.readFile(
				'src/test/data/elastic_search_results/test_index_annotated.json'
			)
		);
	});
	describe('#annotateDocument()', () => {
		it('should correctly annotate the first document', async function () {
			const firstDocument = dummyDocuments.hits.hits[0];
			const result = await annotateDocument(firstDocument);
			assert.deepStrictEqual(result, annotatedDummyDocuments[0]);
		});
		it('should correctly annotate all documents', async function () {
			this.timeout(0);
			const promises = dummyDocuments.hits.hits.map(doc =>
				annotateDocument(doc)
			);
			const result = await Promise.all(promises);
			assert.deepStrictEqual(result, annotatedDummyDocuments);
		});
	});
	describe('#annotate()', () => {
		it('should annotate this piece of text', async function () {
			this.timeout(0);

			assert.notEqual(result, null);
		});
	});
	describe('end2end', () => {
		it('should successfully pull the doc down, annotate it and upload back to the test endpoint', async function () {
			// get the doc
			const id = encodeURIComponent('cond-mat/0108181');
			const path = `test/_doc/${id}`;
			const getDocRequest = buildRequest(arxliveCopy, path, 'GET');
			const { body: document } = await makeRequest(getDocRequest);
			const annotatedDoc = await annotateDocument(
				document,
				annotationField
			);
			const updateResponse = await update(arxliveCopy, 'test', id, {
				dbpedia_entities: annotatedDoc,
			});
			assert.ok(!('error' in updateResponse));
		});
	});
	describe('edgeCases', () => {
		const getAnnotateUpload = async id => {
			const index = 'edge-cases';
			const document = await get(arxliveCopy, index, id);
			const annotatedDocument = annotateDocument(
				document,
				annotationField
			);
			await uploadAnnotatedDocument(
				annotatedDocument,
				id,
				arxliveCopy,
				index
			);
			const updatedDocument = await get(arxliveCopy, index, id, {
				source: true,
			});
			return updatedDocument;
		};
		it('should not produce a dbpedia_entities field, when input is nonsensical', async function () {
			const document = await getAnnotateUpload('nonsensical');
			assert.ok(!('dbpedia_entities' in document));
		});
		it('should not produce a dbpedia_entities field, when input is japanese', async function () {
			const document = await getAnnotateUpload('japanese');
			assert.ok(!('dbpedia_entities' in document));
		});
		it('should not produce a dbpedia_entities field, when input is empty', async function () {
			const document = await getAnnotateUpload('empty-string');
			assert.ok(!('dbpedia_entities' in document));
		});
		it('should not produce a dbpedia_entities field, when input has no field', async function () {
			const document = await getAnnotateUpload('field-missing');
			assert.ok(!('dbpedia_entities' in document));
		});
	});
});
