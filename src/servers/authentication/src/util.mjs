import * as fs from 'fs';
import * as _ from 'lamb';
import * as path from 'path';
import { fileURLToPath } from 'url';


export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const buildRedirectString = (endpoint, paramObject) => {
	const params = new URLSearchParams(paramObject);
	const redirectString = `${endpoint}?${params.toString()}`;
	return redirectString;
};

export const getSecrets = () => {
	const secretPath = path.join(__dirname, '../secrets');
	if (!fs.existsSync(secretPath)) {
		return null;
	}
	const paths = fs.readdirSync(
		secretPath,
		{ withFileTypes: true }
	);
	const directories = _.map(
		_.filter(paths, p => p.isDirectory()),
		_.getKey('name')
	);
	const secretPaths = _.flatMap(
		directories,
		dir => _.map(
			fs.readdirSync(path.join(secretPath, dir)),
			f => ({ dir, f })
	    )
	);
	const readFile = (dir, f) => fs.readFileSync(
		path.join(secretPath, dir, f),
		{ encoding: 'utf-8'}
	);
	const secrets = _.reduce(
		secretPaths,
		(acc, { dir, f }) => (
			{...acc, [dir]: { ...acc[dir], [f]: readFile(dir, f)}}
		),
		{}
	);
	return secrets;
};

export const secrets = getSecrets();
