import { promises as fs } from 'fs';
import * as path from 'path';

import { stringify } from '@svizzle/utils';

export const createPathAndWriteObject = async (path_, data) => {
	const directory = path.dirname(path_);
	await fs.mkdir(directory, { recursive: true });
	await fs.writeFile(path_, stringify(data));
};
