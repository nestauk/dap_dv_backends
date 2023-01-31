import * as assert from 'assert';
import * as fs from 'fs/promises';

import {
	annotateDocument,
	uploadAnnotatedDocument,
} from 'dap_dv_backends_utils/dbpedia/spotlight.mjs';
import { buildRequest, makeRequest } from 'dap_dv_backends_utils/es/requests.mjs';
import { createIndex, deleteIndex } from 'dap_dv_backends_utils/es/index.mjs';
import { update } from 'dap_dv_backends_utils/es/update.mjs';
import { get, create } from 'dap_dv_backends_utils/es/document.mjs';
import { arxliveCopy } from 'dap_dv_backends_utils/conf/config.mjs';

const e2eDocumentID = '0705.1058';

describe('spotlight', () => {
	const annotationField = 'textBody_abstract_article';
	let annotatedDummyDocuments, dummyDocuments;
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

		// create edge-case index
		await createIndex('edge-cases');
		const edgeCaseDocs = JSON.parse(
			await fs.readFile(
				'src/test/data/elastic_search_results/edge_case_documents.json'
			)
		);
		const promises = edgeCaseDocs.map(document =>
			create(arxliveCopy, 'edge-cases', document, { id: document.id })
		);
		await Promise.all(promises);

		// create e2e index
		const mapping = JSON.parse(
			await fs.readFile('src/test/conf/test_index_mapping.json')
		);
		await createIndex('e2e-test', arxliveCopy, {
			payload: {
				...mapping,
				mappings: {
					...mapping.mappings,
					dynamic: true,
				},
			},
		});
		const reindexPayload = {
			source: {
				index: 'original-arxiv_v6',
				query: {
					term: {
						_id: e2eDocumentID,
					},
				},
			},
			dest: {
				index: 'e2e-test',
			},
		};
		const request = buildRequest(arxliveCopy, '_reindex', 'POST', {
			payload: reindexPayload,
		});
		await makeRequest(request);
	});
	after(async function () {
		await deleteIndex('edge-cases');
		await deleteIndex('e2e-test');
	});
	describe('#annotateDocument()', () => {
		it('should correctly annotate the first document', async function () {
			const [ firstDocument ] = dummyDocuments.hits.hits;
			const result = await annotateDocument(
				firstDocument,
				'textBody_abstract_article'
			);
			assert.deepStrictEqual(result, annotatedDummyDocuments[0]);
		});
		it('should correctly annotate all documents', async function () {
			// eslint-disable-next-line no-invalid-this
			this.timeout(0);
			const promises = dummyDocuments.hits.hits.map(doc =>
				annotateDocument(doc, 'textBody_abstract_article')
			);
			const result = await Promise.all(promises);
			assert.deepStrictEqual(result, annotatedDummyDocuments);
		});
	});
	describe('end2end', () => {
		it('should successfully pull the doc down, annotate it and upload back to the test endpoint', async function () {

			// get the doc
			const index = 'e2e-test';
			const document = await get(arxliveCopy, index, e2eDocumentID);
			const annotatedDoc = await annotateDocument(
				document,
				annotationField
			);
			const updateResponse = await update(
				arxliveCopy,
				index,
				e2eDocumentID,
				{
					dbpedia_entities: annotatedDoc,
				}
			);
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
