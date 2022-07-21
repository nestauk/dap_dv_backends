import * as _ from 'lamb';

import { annotationEndpoint } from './config.mjs';
import { annotateIndex } from 'dbpedia/spotlight.mjs';
import { state } from './state.mjs';
import * as terraform from './terraform.mjs';
import { getStatus } from './util.mjs';
import { sleep } from 'util/time.mjs';

const annotate = async ({ domain, index, field, id, workers }) => {
	await annotateIndex(
		domain,
		index,
		annotationEndpoint,
		field
	);
	state.annotating = _.filter(state.annotating, s => s.id !== id);
	state.desiredWorkers -= workers;
};


export const tick = async () => {

	const { status } = await getStatus();

	console.log(status);
	console.log(state);

	// teardown resources if nothing left in queue
	if (state.desiredWorkers === 0 && status === 'ready') {
		terraform.teardown();
		state.instances.ready = [];
	}

	// if state is either down or ready, we can provision resources
	if (status === 'ready' || status === 'down') {

		// begin annotating the data for which we have provisioned resources
		_.forEach(state.provisioning, annotate);
		state.annotating = [...state.annotating, ...state.provisioning];
		state.provisioning = [];

		// if there is work, then provision for that work
		if (state.waiting.length) {
			const newWorkers = _.reduce(state.waiting, (a, c) => a + c.workers, 0);
			state.currentWorkers += newWorkers;
			state.desiredWorkers += newWorkers;

			// save newly provisioned ips
			terraform.provision(state.desiredWorkers);
			state.provisioning = [...state.waiting];
			state.waiting = [];
		// eslint-disable-next-line brace-style
		}

		// if, after provisioning, there are less workers than desired, remove
		// those workers
		else if (
			state.desiredWorkers < state.currentWorkers &&
			state.desiredWorkers !== 0
		) {
			terraform.provision(state.desiredWorkers);
			state.currentWorkers = state.desiredWorkers;
		}
	}

	await sleep(5000);
	tick();
};
