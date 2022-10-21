import * as assert from 'assert';

import * as _ from 'lamb';
import { interpret } from 'xstate';

import { annotateService, provisionService } from './mock.mjs';
import { annotationMachine } from '../src/machine.mjs';

const mockMachine = annotationMachine.withConfig({
	services: {
		annotateService,
		provisionService
	}
});

const events = [
	{ type: 'PROVISION', id: 'first', sleep: 500, workers: 3 },
	{ type: 'PROVISION', id: 'second', sleep: 3000, workers: 5 },
	{ type: 'PROVISION', id: 'third', sleep: 4000, workers: 2 },
	{ type: 'PROVISION', id: 'fourth', sleep: 5000, workers: 3 },
	{ type: 'PROVISION', id: 'fifth', sleep: 1000, workers: 5 },
	{ type: 'PROVISION', id: 'sixth', sleep: 2000, workers: 2 },
];

const service = interpret(mockMachine)
.onTransition(state => {
	console.log(state.event.type);
	console.log(state.context);
})
.start();

_.forEach(events, event => service.send(event));

// TODO: Debug why tests below aren't working
// describe('machine', function() {
// 	it('should test a single request', async function (done) {
// 		console.log("testing");

// 		this.timeout(0);
// 		const service = await interpret(mockMachine);

// 		let testHasFailed = false;

// 		service.start();
// 		service.onTransition(state => {
// 			console.log(state.value);
// 			assert.deepStrictEqual(1, 2);
// 			done();

// 			// if (state.matches('annotating.working')) {
// 			// 	console.log("match");
// 			// 	assert.deepStrictEqual(context.annotating[0], events[0]);
// 			// 	console.log("after");
// 			// 	throw new Error('error');
// 			// }
// 		});
// 		service.send(events[0]);


// 		// assert.strictEqual(1, 2);
// 	});
// });


