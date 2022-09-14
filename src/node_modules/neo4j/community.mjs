import * as _ from 'lamb';

import { getSession } from 'neo4j/driver.mjs';
import { promisify } from 'neo4j/util.mjs';

const getMetadata = data => {
	const intermediateCommunities = data[0].intermediateCommunityIds.length;
	const communityCount = _.keys(_.group(data, _.getKey('community'))).length;
	const intermediateCounts = _.map(
		_.range(0, intermediateCommunities),
		idx => {
			const communities = _.group(data, r => r.intermediateCommunityIds[idx]);
			const counts = _.keys(communities).length;
			return counts;
		}
	);
	const metadata = {
		intermediateCommunities,
		communityCount,
		intermediateCounts
	};
	return metadata;
};

const objectToString = object => _.reduce(
	_.pairs(object),
	(acc, [key, value]) => `${acc.length ? `${acc},` : ''} ${key}: ${value}`,
	''
);

const generateCommand = (graph, options) => `
CALL gds.louvain.stream('${graph}', { ${objectToString(options)} })
YIELD nodeId, communityId, intermediateCommunityIds
RETURN gds.util.asNode(nodeId).URI AS URI, communityId, intermediateCommunityIds
ORDER BY communityId ASC
`;

export const stream = async (graph, options) => {
	const [session, driver] = await getSession();
	const command = generateCommand(graph, options);
	const result = session.run(command);
	const data = await promisify(result, session, driver);
	const metadata = getMetadata(data);

	return { data, metadata };
};
