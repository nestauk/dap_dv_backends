/* eslint-disable no-await-in-loop */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lamb';
import * as path from 'path';

import { SERVER_DIRECTORY, TERRAFORM_DIRECTORY } from './conf.mjs';
import { generateConfiguration } from 'terraform/configuration.mjs';
import { getCurrentState } from 'terraform/state.mjs';
import { init, apply } from 'terraform/commands.mjs';
import { displayCommandOutput } from 'util/shell.mjs';
import { sleep } from 'util/time.mjs';
import { getIps, endpointToIp, getEndpoints, getNewEndpoints, spotlightEndpointPromise } from './util.mjs';
import { state } from './state.mjs';

export const launchSpotlightContainers = async ips => {

	console.log('[+] Launching Spotlight Containers');
	const command = await fs.readFile(
		path.join(SERVER_DIRECTORY, 'spotlightDockerCommand.sh'),
		{ encoding: 'utf-8'}
	);
	_.forEach(ips, ip => {
		exec(`ssh -oStrictHostKeyChecking=accept-new -i ~/.ssh/spotlight.pem ubuntu@${ip} "cd /home/ubuntu ; ${command}"`, displayCommandOutput);
	});
	console.log('[+] Done.');
};

export const configureLoadBalancer = async ips => {

	console.log('[+] Configuring Load Balancer...');
	const ips_ = _.map(ips, ip => `server ${ip}:2222;`);
	const ipStrings = _.join(ips_, '\n\t	');
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

export const bootstrap = async () => {
	state.endpoints = getEndpoints(await getCurrentState(TERRAFORM_DIRECTORY));
	state.workers = state.endpoints.length;
	state.status = state.workers ? 'up' : 'down';
};

export const setup = async workers => {

	const configPath = path.join(TERRAFORM_DIRECTORY, 'main.tf.json');
	generateConfiguration(workers, configPath);
	await init(TERRAFORM_DIRECTORY);
	await apply(TERRAFORM_DIRECTORY);

	const currentState = await getCurrentState(TERRAFORM_DIRECTORY);
	const currentEndpoints = getEndpoints(currentState);
	const currentIps = getIps(currentState);

	configureLoadBalancer(currentIps);

	// Check if we have new endpoints we need to launch new containers then test
	if (currentEndpoints.length > state.endpoints.length) {
		const newEndpoints = getNewEndpoints(currentState);
		const newIps = _.map(newEndpoints, endpointToIp);

		// wait to ensure instances are running
		// TODO: Keep polling instance until sure we can connect
		await sleep(1000 * 60);
		launchSpotlightContainers(newIps);
		console.log('[+] Creating new nodes...');
		await spotlightEndpointPromise(newEndpoints);
	}

	return Promise.resolve({
		status: currentEndpoints.length ? 'up' : 'down',
		workers: currentEndpoints.length,
		endpoints: currentEndpoints
	});
};
