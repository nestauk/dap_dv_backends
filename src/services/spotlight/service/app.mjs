import express from 'express';

import { destroy } from 'terraform/commands.mjs';
import { getCurrentState } from 'terraform/state.mjs';

import { TERRAFORM_DIRECTORY } from '../config.mjs';
import { bootstrap, configureLoadBalancer, setup } from './infrastructure.mjs';
import { state } from '../state.mjs';


const app = express();
const port = 3000;

await bootstrap();

app.use(express.json()); // for parsing application/json

// eslint-disable-next-line consistent-return
app.post('/provision', (req, res) => {
	const { workers=4 } = req.body;
	if (workers === 0) {
		return res.redirect('/teardown');
	}
	state.status = 'scheduling';
	setup(workers).then(({ status, workers: workers_, endpoints }) => {
		state.status = status;
		state.workers = workers_;
		state.endpoints = endpoints;
		console.log('[+] Done');
	});
	res.send();
});

app.get('/teardown', (_, res) => {
	state.status = 'destroying';
	destroy(TERRAFORM_DIRECTORY).then(() => {
		configureLoadBalancer([]);
		state.status = 'down';
		state.workers = 0;
		state.endpoints = [];
		console.log('[+] Done');
	});
	res.send();
});

app.get('/state', async (_, res) => {
	const terraformState = await getCurrentState(TERRAFORM_DIRECTORY);
	res.send(terraformState);
});

app.get('/status', (_, res) => {
	res.send(state);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});


