import * as _ from 'lamb';

import { getSession } from 'neo4j/driver.mjs';

import { promisify } from 'neo4j/util.mjs';

export const project = async(graphName, threshold) => {
	const [session, driver] = await getSession();
	const command = `
    CALL gds.graph.project.cypher(
        '${graphName}',
        'MATCH (n:Entity)-[r:APPEARS_IN_ABSTRACT]-(m:Entity) WHERE r.confidence >= ${threshold} RETURN id(n) AS id',
        'MATCH (n:Entity)-[r:APPEARS_IN_ABSTRACT]-(m:Entity) WHERE r.confidence >= ${threshold} RETURN id(n) AS source, id(m) AS target')
      YIELD
        graphName AS graph, nodeQuery, nodeCount AS nodes, relationshipQuery, relationshipCount AS rels
    `;
	const result = session.run(command);
	return promisify(result, session, driver);
};

export const drop = async graphName => {
	const [session, driver] = await getSession();
	const command = `CALL gds.graph.drop('${graphName}')`;
	const result = session.run(command);
	return promisify(result, session, driver);
};
