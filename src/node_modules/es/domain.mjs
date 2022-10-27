import { buildRequest, makeRequest } from 'es/requests.mjs';


export const info = async domain => {
	const request = buildRequest(domain, '', 'GET');
	const { body: response } = await makeRequest(request);
	return response;
};
