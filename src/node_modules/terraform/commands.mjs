import { promisify } from 'node:util';
import { exec } from 'child_process';

import { displayCommandOutput } from 'util/shell.mjs';

const execAwait = promisify(exec);

export const init = async dir => {
	const initCommand =
		`terraform -chdir=${dir} init`;
	console.log("[+] Terraform - Initialising...");
	await execAwait(initCommand);
};

export const apply = async dir => {
	const applyCommand =
	`terraform -chdir=${dir} apply -auto-approve`;
	console.log("[+] Terraform - Applying...");
	await execAwait(applyCommand);
};


export const destroy = async dir => {
	const destroyCommand =
		`terraform -chdir=${dir} destroy -auto-approve`;
	console.log("[+] Terraform - Destroying...");
	await execAwait(destroyCommand);
};
