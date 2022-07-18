import * as _ from 'lamb';
import { createClient } from 'redis';

import { arxliveCopy } from 'conf/config.mjs';
import { scroll, clearScroll } from 'es/search.mjs';

import * as serverConfig from './config.mjs';

export const redisClient = createClient();

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();
await redisClient.flushDb();

const seed = async () => {
	const scroller = scroll(
		arxliveCopy,
		serverConfig.evaluationIndex,
		{ size: 1000 }
	);

	let page;
	for await (page of scroller) {
		const docs = page.hits.hits;
		await Promise.all(_.map(docs, ({_source}) =>
			redisClient.sAdd(_source.userId, _source.orgEsId)
		));
	}

	// empty index means no page is returned
	if (page) {
		clearScroll(arxliveCopy, page._scroll_id);
	}
};

await seed();
