import { promises as fs } from 'fs';

import { stringify } from '@svizzle/utils';
import { fetch } from 'undici';

const SUBSCRIPTION_KEY = process.env.AZURE_SUBSCRIPTION_KEY;
if (!SUBSCRIPTION_KEY) {
	throw new Error('AZURE_SUBSCRIPTION_KEY is not set.');
}

export const search = async (query, { mkt='en-GB' } = {}) => {
	const host = 'https://api.bing.microsoft.com';
	const path = `v7.0/search?q=${encodeURIComponent(query)}&mkt=${mkt}`;
	const headers = { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY };
	const response = await fetch(`${host}/${path}`, { headers });
	if (response.status !== 200) {
		throw new Error(`Bing search failed.\nResponse:\n${stringify(response)}`);
	}
	const data = await response.json();
	return data;
};
