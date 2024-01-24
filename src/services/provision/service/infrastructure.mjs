/* eslint-disable no-await-in-loop */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lamb';
import * as path from 'path';

import { init, apply } from 'dap_dv_backends_utils/terraform/commands.mjs';
import { getCurrentState } from 'dap_dv_backends_utils/terraform/state.mjs';
import { displayCommandOutput } from 'dap_dv_backends_utils/util/shell.mjs';
import { sleep } from 'dap_dv_backends_utils/util/time.mjs';

import { WORKER_PORT, SERVER_DIRECTORY, TERRAFORM_DIRECTORY } from '../config.mjs';
import { PROVISION_PORT } from '../../config.mjs';
import { generateAndWriteConfiguration } from './configuration.mjs';
import { getIps, endpointToIp, getEndpoints, getNewEndpoints, annotationNodeEndpointPromise } from './util.mjs';
import { state } from './state.mjs';

import { processAndSaveTemplate } from '../../../utils/template.mjs';

export const launchAnnotationNodes = async ips => {

	console.log('[+] Launching Annotation Nodes');
	const command = await fs.readFile(
		path.join(SERVER_DIRECTORY, 'spotlightDockerCommand.sh'),
		{ encoding: 'utf-8'}
	);

	// Re `spotlight.pem`, see note [1] at the bottom of `./configuration.mjs`
	_.forEach(ips, ip => {
		exec(`ssh -oStrictHostKeyChecking=accept-new -i ~/.ssh/spotlight.pem ubuntu@${ip} "cd /home/ubuntu ; ${command}"`, displayCommandOutput);
	});
	console.log('[+] Done.');
};

export const configureLoadBalancer = async ips => {

	console.log('[+] Configuring Load Balancer...');
	const ips_ = _.map(ips, ip => `server ${ip}:${WORKER_PORT};`);
	const ipStrings = _.join(ips_, '\n');

	const upstream = ips.length
		? `upstream annotation_node {
		${ipStrings}
	}
	server {
		listen ${WORKER_PORT};
		location / {
			proxy_pass http://annotation_node;
		}
	}`
		: '';
	const annotate = ips.length
		? `location /annotate {
			proxy_pass http://annotation_node/annotate;
		}`
		: '';

	const nginxConfigPath = path.join(SERVER_DIRECTORY, 'nginx.conf');
	const templatePath = path.join(
		SERVER_DIRECTORY,
		'../../../nginx/nginx.provisioner.template.conf'
	);
	const replacementVars = {
		TERRAFORM_UPSTREAM: upstream,
		TERRAFORM_PROXY: annotate,
		PROVISION_PORT
	};

	processAndSaveTemplate(templatePath, replacementVars, nginxConfigPath);
	exec('sudo nginx -s reload', displayCommandOutput);
};

export const bootstrap = async () => {
	const state_ = await getCurrentState(TERRAFORM_DIRECTORY);
	state.endpoints = state_ ? getEndpoints(state_) : [];
	state.workers = state.endpoints.length;
	state.status = state.workers ? 'up' : 'down';
};

export const setup = async workers => {

	const configPath = path.join(TERRAFORM_DIRECTORY, 'main.tf.json');
	generateAndWriteConfiguration(workers, configPath);
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
		launchAnnotationNodes(newIps);
		console.log('[+] Creating new nodes...');
		await annotationNodeEndpointPromise(newEndpoints);
	}

	return Promise.resolve({
		status: currentEndpoints.length ? 'up' : 'down',
		workers: currentEndpoints.length,
		endpoints: currentEndpoints
	});
};
