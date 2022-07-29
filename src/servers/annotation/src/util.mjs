import * as path from 'path';
import { fileURLToPath } from 'url';

import * as _ from 'lamb';

import { annotationEndpoint } from './config.mjs';
import { state } from './state.mjs';
import * as terraform from './terraform.mjs';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const pickIfTrue = _.pickIf(_.identity);

export const testSpotlightEnpoint = async endpoint => {
	const url = new URL(endpoint);
	const text = 'This is some text with the words Semantic Web in it.';
	const confidence = 0.6;
	url.searchParams.append('text', text);
	url.searchParams.append('confidence', confidence);
	let response;
	try {
		response = await fetch(url);
	} catch {
		return false;
	}
	return response.ok;
};

const updateInstanceIps = terraformState => {
	const ips = _.map(
		_.values(terraformState.outputs),
		_.getKey('value')
	);

	// ips that have been added
	const newIps = _.filter(
		ips,
		ip => !state.instances.ready.includes(ip) &&
			  !state.instances.provisioning.includes(ip)
	);
	state.instances.provisioning = [
		...state.instances.provisioning,
		...newIps
	];

	// remove ips for resources that have been torn down
	state.instances.ready = _.filter(
		state.instances.ready,
		ip => ips.includes(ip)
	);
};

export const testProvisionedInstances = async () => {

	console.log("TESTING PROVISIONED RESOURCES");
	const terraformState = await terraform.state();
	updateInstanceIps(terraformState);

	// if there are no instances in provisioning, state is ready
	if (!state.instances.provisioning.length) {
		return true;
	}

	const endpoints = _.map(
		state.instances.provisioning,
		ip => `http:${ip}:2222/rest/annotate`
	);

	const results = await Promise.all(_.map(
		endpoints,
		testSpotlightEnpoint
	));
	const states = _.make(state.instances.provisioning, results);
	console.log(states);

	// move ready ips from provisioning to ready
	const ready = _.keys(pickIfTrue(states));
	state.instances.ready = [
		...state.instances.ready,
		...ready
	];
	state.instances.provisioning = _.filter(
		state.instances.provisioning,
		ip => !ready.includes(ip)
	);
	return state.instances.provisioning.length === 0;
};

export const getStatus = async () => {

	const statusResponse = await terraform.status();
	if (statusResponse.status === 'up') {
		statusResponse.status = await testProvisionedInstances()
			? 'ready'
			: 'provisioning';
	}
	return statusResponse;
};
