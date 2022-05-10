import { fetch } from 'undici';


// eslint-disable-next-line no-process-env
const ACCESS_TOKEN = process.env.WIKIMEDIA_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
	throw new Error('WIKIMEDIA_ACCESS_TOKEN is not set.');
}

const domain = 'https://api.wikimedia.org/core/v1/wikipedia';

/**
 *
 * @param {string} title - Title of the Wikipedia page to fetch
 * @param {Object} options
 * @param {string} [options.language='en] - Language of source Wikipedia page
 * @param {boolean} [options.bare=true] - Whether to fetch just the page's metadata or the entire contents of the page.
 * @returns {Object} - response object
 */
export const getPage = async (title, { language='en', bare=true } = {}) => {
	const path = `${language}/page/${encodeURIComponent(title)}${bare ? '/bare' : ''}`;
	const url = `${domain}/${path}`;
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${ACCESS_TOKEN}`,
			'Api-User-Agent': 'ai_map'
		}
	});

	return {
		code: response.status,
		body: await response.json()
	};
};
