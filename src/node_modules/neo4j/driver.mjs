
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import * as neo4j from 'neo4j-driver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getSession = async () => {
	const credentials = `${__dirname}/secrets/credentials.json`;
	const { user, password } = JSON.parse(await fs.readFile(credentials));
	const uri = 'bolt://3.8.167.48:7687';
	const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

	const session = driver.session();
	return [session, driver];
};
