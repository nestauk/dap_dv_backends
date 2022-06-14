import { fetch } from 'undici';


export const query = async(
	sparql,
	endpoint='https://dbpedia.org/sparql',
	{ responseFormat='application/json' } = {}
) => {
	const headers = {
		Accept: responseFormat,
		'Content-Type': 'application/sparql-query'
	};
	const response = await fetch(endpoint,
		{
			method: 'POST',
			body: sparql,
			headers
		}
	);
	if (responseFormat === 'application/json') {
		return response.json();
	}
	return response;
};


