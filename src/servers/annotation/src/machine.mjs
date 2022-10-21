import * as _ from 'lamb';
import { createMachine, assign, interpret } from 'xstate';
import { from, map, mergeAll } from 'rxjs';

import * as spotlight from 'dbpedia/spotlight.mjs';
import * as terraform from './terraform.mjs';


const provisionService = (context, event) => callback => {
	terraform.provision(context.desiredWorkers).then(() => {
		context.currentWorkers = context.desiredWorkers;
		callback('READY');
	});
	if (event.type !== 'ANNOTATED') {
		context.provisioning = [
			...context.waiting
		];
		context.waiting = [];
	}
};

const annotateService = context => {

	const observable = from(context.provisioning)
	.pipe(
		map(request => spotlight.annotateRequest(request)),
		mergeAll(),
		map(request => {
			context.annotating = _.filter(
				context.annotating,
				r => r.id !== request.id
			);
			context.finished = [...context.finished, request];
			context.desiredWorkers -= request.workers;
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

// stately viz: https://stately.ai/viz/0fba86ba-8c93-4a1d-b971-00a02e717af4
/** @xstate-layout N4IgpgJg5mDOIC5QEMB2qD2AXZWCWGqAdGpjvqlEXhADZgDEASgKICCAIgJoDaADAF1EoAA4ZYefIWEgAHogCMANj5EAnBrUAOAOxKATABYFAVh2GAzABoQAT0T6FFosqVLDO5Tq1aLJgL7+NqTYuATEIeR4lEQA7hgATgDW0VAMbAByGQDyACpsuSwc-EJIIGISUqgy8gjKqpraekam5tZ2ikoKLm5KJoZqfPreJnw6gcHooVVEIgkYAG54EoSp1HSMAApM2QBqAJIAyvvZGSUyFZLhNZ0NmroGxmaWNvYIhkrOar1qehb6uhMFnGQRAkTChFm8yWK1Qaxo9HSWTyBSK5zKlyqNzqKnU92aTzar0QJgMREMJgUYy6WgU5m+EzBUyikLmi2W4TWACMAK6wWwMbZ7I4nM6CC7iK7SMq1QyGfREdxaOVqfQmVXynTE94AnpuDx+X4KD6M8EzNkwzkxXn85jsbjo0SSrEyxAWLRKIh8CwKNXAoxqDxajoIYGe1x9UaBroGU3MiHEC0c1bWvkC1icXgKUpOyrXV04u4aB4tZ7tN7GbrfJQ6PhAms6PS-QKgzAQOAyM3hEjxihUBFgCV56WgWo6fTarzk+5KaPfWmGONkBM95d9uKJFKUIdS6oFj6qR6q0k6Cx8PhaSdAvGac+GPiqnxL6bdrvbjHO-OjhyGbXuG8aDo3yqkMagBKCXastCyZwjEA47i634IOO2qGFoJhEPoF5aIMjYeJ8FjPiyibQbC3JpghX5yIg95aEQ-RKLoeg+MCAzliSPqKpSQzqheJg+CCkxrt2SZke+ua7tiRjagCOh6p8gb-NoChqERCaUSO1EIAAtNJIa6YuLZAA */
export const annotationMachine = createMachine(
	{
		context: {
			waiting: [],
			provisioning: [],
			annotating: [],
			finished: [],
			currentWorkers: 0,
			desiredWorkers: 0,
		},
		id: "annotation",
		type: "parallel",
		states: {
			annotating: {
				initial: "idle",
				states: {
					idle: {
						on: {
							READY: {
								target: "working",
								cond: "annotatingLeftToDo",
							},
						},
					},
					working: {
						invoke: {
							src: "annotateService",
						},
						on: {
							ANNOTATED: {
								target: "idle",
								cond: "annotationEmpty",
							},
						},
					},
				},
			},
			provisioning: {
				initial: "idle",
				states: {
					idle: {
						on: {
							PROVISION: {
								target: "busy",
								actions: "addToWaiting",
							},
							ANNOTATED: {
								target: "busy",
							},
						},
					},
					busy: {
						invoke: {
							src: "provisionService",
						},
						on: {
							PROVISION: {
								actions: "addToWaiting",
							},
							READY: [
								{
									target: "busy",
									cond: "provisioningLeftToDo",
									internal: false,
								},
								{
									target: "idle",
								},
							],
						},
					},
				},
			},
		},
	},
	{
		actions: {
			addToWaiting: assign({
				waiting: (context, event) => [...context.waiting, event],
				desiredWorkers: (context, event) =>
					context.desiredWorkers + event.workers,
			}),
		},
		guards: {
			annotationEmpty: context => context.annotating.length === 0,
			annotatingLeftToDo: context => context.desiredWorkers !== 0,
			provisioningLeftToDo: context =>
				context.waiting.length ||
				context.desiredWorkers !== context.currentWorkers,
		},
		services: {
			annotateService,
			provisionService
		}
	}
);

export const annotationService = interpret(annotationMachine)
.onTransition(state => {
	console.log(state.event.type);
	console.log(state.toStrings());
	console.log(state.context);
})
.start();
