import { promises as fs } from 'fs';
import * as path from 'path';

export const getCurrentState = async dir => {
	let state;
	try {
		state = JSON.parse(await fs.readFile(path.join(dir, 'terraform.tfstate'), { encoding: 'utf-8'}));
	} catch {
		state = null;
	}
	if (!state) {
		return false;
	}
	return state;
};
