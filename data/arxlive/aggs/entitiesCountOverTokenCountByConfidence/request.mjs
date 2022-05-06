import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const main = async () => {
	const confidences = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
	const aggs = confidences.reduce((acc, conf) => {
		return {
			...acc,
			[`entities_count_over_token_count_at_${conf}_extended_stats`]: {
				extended_stats: {
					script: `if (doc['dbpedia_entities_metadata.confidence_counts.${conf}'].size() == 0 || doc['textBody_abstract_article.token_count'].size() == 0) { return 0; } return ((double) doc['dbpedia_entities_metadata.confidence_counts.${conf}'].value) / doc['textBody_abstract_article.token_count'].value;`
				}
			},
			[`entities_count_over_token_count_at_${conf}_histogram`]: {
				histogram: {
					script: `if (doc['dbpedia_entities_metadata.confidence_counts.${conf}'].size() == 0 || doc['textBody_abstract_article.token_count'].size() == 0) { return 0; } return ((double) doc['dbpedia_entities_metadata.confidence_counts.${conf}'].value) / doc['textBody_abstract_article.token_count'].value;`,
					interval: 0.01,
					min_doc_count: 1
				}
			}
		};
	}, {});
	const payload = {
		size: 0,
		aggs
	};
	const requestString = JSON.stringify(payload, null, 4);
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	await fs.writeFile(`${__dirname}/request.json`, requestString);
};

main();
