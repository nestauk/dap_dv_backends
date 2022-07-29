import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lamb';
import * as path from 'path';

import { generateConfiguration } from 'terraform/configuration.mjs';
import { getCurrentState } from '../../node_modules/terraform/state.mjs';
import { init, apply } from '../../node_modules/terraform/commands.mjs';
import { displayCommandOutput } from '../../node_modules/util/shell.mjs';
import { sleep } from '../../node_modules/util/time.mjs';
import { state } from './state.mjs';


const SERVER_DIRECTORY = 'src/servers/spotlight';
const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

export const launchSpotlightContainers = async terraformState => {

	console.log('[+] Launching Spotlight Containers');
	const ips = _.map(_.values(terraformState.outputs), _.getKey('value'));
	const command = await fs.readFile(
		path.join(SERVER_DIRECTORY, 'spotlightDockerCommand.sh'),
		{ encoding: 'utf-8'}
	);
	_.forEach(ips, ip => {
		exec(`ssh -oStrictHostKeyChecking=accept-new -i ~/.ssh/spotlight.pem ubuntu@${ip} "cd /home/ubuntu ; ${command}"`, displayCommandOutput);
	});
	console.log('[+] Done.');
};

export const configureLoadBalancer = async terraformState => {

	console.log('[+] Configuring Load Balancer...');
	const ips = _.map(
		_.values(terraformState.outputs),
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

	generateConfiguration(workers, path.join(TERRAFORM_DIRECTORY, 'main.tf.json'));
	await init(TERRAFORM_DIRECTORY);
	await apply(TERRAFORM_DIRECTORY);

	const currentState = await getCurrentState(TERRAFORM_DIRECTORY);
	configureLoadBalancer(currentState);

	// wait to ensure instances are running
	// TODO: Keep polling instance until sure we can connect
	await sleep(1000 * 60);

	// TODO: Handle provisioning of existing resources more gracefully
	launchSpotlightContainers(currentState);
};
