import sha256 from '@aws-crypto/sha256-browser';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';

import { sleep } from 'util/time.mjs';

const { Sha256 } = sha256;

const signer = new SignatureV4({
	credentials: defaultProvider(),
	region: 'eu-west-2',
	service: 'es',
	sha256: Sha256,
});

/**
 * @function buildRequest
 * @description builds a HttpRequest object using the AWS sdk. Needed for signing the request using Environment variables.
 * @param {string} domain ElasticSearch domain on which to make request.
 * @param {string} path - additional path, appended after the domain in the request URL.
 * @param {string} method - HTTP request method (GET, POST, etc.).
 * @param {Object} [options]
 * @param {Object|string} [options.payload] - optional payload for the request. Can be passed as object and subsequently stringifyed.
 * @param {Object} [options.query={}] - optionaly query object for using the search API.
 * @returns {HttpRequest} the AWS HttpRequest object, signed using AWS credentials.
 */
export const buildRequest = (
	domain,
	path,
	method,
	{ payload, contentType = 'application/json', query = {} } = {}
) => {
	const body =
		payload && typeof payload !== 'string'
			? JSON.stringify(payload)
			: payload;
	return new HttpRequest({
		body,
		method,
		path,
		query,
		headers: {
			'Content-Type': contentType,
			host: domain,
		},
		hostname: domain,
	});
};

/**
 * @function parseResponseBody
 * @description helper function which returns promise of signed response object's body
 * @param {Object} response - response object obtained from {@link makeRequest}
 * @returns {Promise} promise which resolves to the response's body
 */
const parseResponseBody = response => {
	let responseBody = '';
	return new Promise((resolve, reject) => {
		response.body.on('data', chunk => {
			responseBody += chunk;
		});
		response.body.on('end', () => {
			try {
				resolve(JSON.parse(responseBody));
			} catch (e) {
				reject(e);
			}
		});
	});
};

/**
 * @function _makeRequest
 * @description makes a request using a HttpRequest object.
 * @param {HttpRequest} request - the HttpRequest object built using {@link buildRequest}
 * @param {Object} [options={}]
 * @param {boolean} [options.verbose] - whether to log the output of the request and response.
 * @returns {Object} the HttpResponse object
 */
const _makeRequest = async request => {

	// Sign the request
	const signedRequest = await signer.sign(request);

	// Send the request
	const client = new NodeHttpHandler();
	const { response } = await client.handle(signedRequest);
	const responseBody = await parseResponseBody(response);

	return {
		code: response.statusCode,
		message: response.body.statusMessage,
		body: responseBody,
	};
};

/**
 * @function makeRequest
 * @description wraps the makeRequest function with try/catch and retry logic.
 * @param {HttpRequest} request - the HttpRequest object built using {@link buildRequest}
 * @param {Object} [options={}]
 * @param {boolean} [options.retry] - how long to wait between trys.
 * @param {boolean} [options.limit] - how many times to retry.
 * @returns {Object} the HttpResponse object
 */
export const makeRequest = async (request, { retry=null, limit=10 }={}) => {
	const promise = _makeRequest(request);
	const result = promise
	.then(value => value)
	.catch(async err => {
		if (retry && limit !== 0) {
			await sleep(retry);
			return makeRequest(request, { retry, limit: limit-1 });
		}
		throw err;

	});
	return result;
};
