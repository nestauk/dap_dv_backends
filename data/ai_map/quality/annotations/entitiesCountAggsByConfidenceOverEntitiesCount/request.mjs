import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const main = async () => {
	const confidences = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
	const aggs = confidences.reduce((acc, conf) => {
		return {
			...acc,
			[`confidence_${conf}_normalised_with_entities_count_extended_stats`]: {
				extended_stats: {
					script: `if (doc['dbpedia_entities_metadata.confidence_counts.${conf}'].size() == 0 || doc['dbpedia_entities_metadata.entities_count'].size() == 0) { return 0; } return ((double) doc['dbpedia_entities_metadata.confidence_counts.${conf}'].value) / doc['dbpedia_entities_metadata.entities_count'].value;`
				}
			},
			[`confidence_${conf}_normalised_with_entities_count_histogram`]: {
				histogram: {
					script: `if (doc['dbpedia_entities_metadata.confidence_counts.${conf}'].size() == 0 || doc['dbpedia_entities_metadata.entities_count'].size() == 0) { return 0; } return ((double) doc['dbpedia_entities_metadata.confidence_counts.${conf}'].value) / doc['dbpedia_entities_metadata.entities_count'].value;`,
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
