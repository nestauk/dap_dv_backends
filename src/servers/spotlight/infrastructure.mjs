import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lamb';
import * as path from 'path';

import { generateConfiguration } from 'terraform/configuration.mjs';
import { getCurrentState } from '../../node_modules/terraform/state.mjs';
import { init, apply } from '../../node_modules/terraform/commands.mjs';
import { displayCommandOutput } from '../../node_modules/util/shell.mjs';
import { sleep } from '../../node_modules/util/time.mjs';

const SERVER_DIRECTORY = 'src/servers/spotlight';
const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

export const launchSpotlightContainers = async state => {

	console.log('[+] Launching Spotlight Containers');
	const ips = _.map(_.values(state.outputs), _.getKey('value'));
	const command = await fs.readFile(
		path.join(SERVER_DIRECTORY, 'spotlightDockerCommand.sh'),
		{ encoding: 'utf-8'}
	);
	console.log(command);

	_.map(ips, ip => {
		exec(`ssh -oStrictHostKeyChecking=accept-new -i ~/.ssh/spotlight.pem ubuntu@${ip} "cd /home/ubuntu ; ${command}"`, displayCommandOutput);
	});
};

export const configureLoadBalancer = async state => {

	console.log('[+] Configuring Load Balancer...');
	const ips = _.map(
		_.values(state.outputs),
		output => `server ${output.value}:2222;`);
	const ipStrings = _.join(
		ips,
		'\n\t	'
	);
	const nginxConfiguration = `events {}
http {
	upstream spotlight {
		${ipStrings}
	}

	server {
		listen 2222;
		location / {
			proxy_pass http://spotlight;
		}
	}
	server {
		listen 80;
		location /annotate {
			proxy_pass http://spotlight/rest/annotate;
		}
		location / {
			proxy_pass http://localhost:3000;
		}
	}
}
`;
	await fs.writeFile(path.join(SERVER_DIRECTORY, 'nginx.conf'), nginxConfiguration);
	exec('sudo nginx -s reload', displayCommandOutput);
};

export const setup = async workers => {

	const previousState = await getCurrentState(TERRAFORM_DIRECTORY);

	// if there are no resources, provision some
	if (!previousState || !previousState.resources.length) {
		generateConfiguration(workers, path.join(TERRAFORM_DIRECTORY, 'main.tf.json'));

		// not sure why, but a sleep here is neccessary in order to ensure
		// configuration file is available to the Terraform apply command
		await sleep(100);

		init(TERRAFORM_DIRECTORY);
		apply(TERRAFORM_DIRECTORY);
	}

	const currentState = await getCurrentState(TERRAFORM_DIRECTORY);
	configureLoadBalancer(currentState);

	// wait at least another minute to ensure instances are running
	await sleep(1000 * 60);
	launchSpotlightContainers(currentState);
};
