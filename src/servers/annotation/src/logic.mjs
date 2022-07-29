import * as _ from 'lamb';

import { state } from './state.mjs';

const getTestStatus = () => {
	return state.status;
};

const teardown = () => {
	console.log("Tearing down");
	state.status = 'down';
};

const provision = () => {
	state.status = 'provisioning';
	setTimeout(() => {
		console.log("Setting status to ready");
		state.status = 'ready';
	}, 30 * 1000);
};

const annotate = input => {
	console.log(`Annotating ${input}`);
	setTimeout(() => {
		state.annotating = _.filter(state.annotating, s => s.id !== input.id);
		state.desiredWorkers -= input.workers;
	}, _.randomInt(1, 30) * 1000);
};

export const tick = () => {

	const status = getTestStatus();

	// teardown resources if nothing left in queue
	if (state.desiredWorkers === 0 &&
		state.currentWorkers === 0 &&
		status !== 'down') {
		teardown();
	}

	// if state is either down or ready, we can provision resources
	if (status === 'ready' || status === 'down') {

		// begin annotating the tasks for which we have provisioned resources
		_.forEach(state.provisioning, annotate);
		state.annotating = [...state.annotating, ...state.provisioning];
		state.provisioning = [];

		// if there is work, then provision for that work
		if (state.waiting.length) {
			const newWorkers = _.reduce(
				state.waiting,
				(a, c) => a + c.workers, 0
			);
			state.currentWorkers += newWorkers;
			state.desiredWorkers += newWorkers;
			provision();
			state.provisioning = [...state.waiting];
			state.waiting = [];
		// eslint-disable-next-line brace-style
		}

		// if, after provisioning, there are less workers than desired, remove
		// those workers
		else if (state.desiredWorkers < state.currentWorkers) {
			provision();
			state.currentWorkers = state.desiredWorkers;
		}
	}
};
