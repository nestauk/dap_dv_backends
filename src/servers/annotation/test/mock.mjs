import * as _ from 'lamb';
import { from, map, mergeAll } from 'rxjs';

import { sleep } from 'util/time.mjs';

const terraform = {
	async provision(input) {
		await sleep(input.sleep);
	},
	teardown() {
		console.log('tearing down');
	},
};

const spotlight = {
	async annotateIndex(input) {
		await sleep(input.sleep);
		return input;
	},
};

export const annotateService = context => {
	const observable = from(context.provisioning)
	.pipe(
		map(resource => spotlight.annotateIndex(resource)),
		mergeAll(),
		map(resource => {
			context.annotating = _.filter(
				context.annotating,
				r => r.id !== resource.id
			);
			context.finished = [...context.finished, resource];
			context.desiredWorkers -= resource.workers;
			return { type: 'ANNOTATED' };
		})
	);
	context.annotating = [
		...context.annotating,
		...context.provisioning,
	];
	context.provisioning = [];
	return observable;
};

export const provisionService = (context, event) => callback => {
	terraform
	.provision(context.desiredWorkers)
	.then(() => {
		context.currentWorkers =
				context.desiredWorkers;
		callback('READY');
	});
	if (event.type !== 'ANNOTATED') {
		context.provisioning = [
			...context.waiting
		];
		context.waiting = [];
	}
};
