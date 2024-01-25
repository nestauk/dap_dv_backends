import express from 'express';

import { destroy } from 'dap_dv_backends_utils/terraform/commands.mjs';
import { getCurrentState } from 'dap_dv_backends_utils/terraform/state.mjs';

import { PORT, provisionEndpoint, TERRAFORM_DIRECTORY } from '../config.mjs';
import { bootstrap, configureLoadBalancer, setup } from './infrastructure.mjs';
import { state } from './state.mjs';


const app = express();

await bootstrap();

app.use(express.json()); // for parsing application/json

// eslint-disable-next-line consistent-return
app.post('/create', (req, res) => {
	const { workers=4 } = req.body;
	if (workers === 0) {
		return res.redirect(`${provisionEndpoint}/teardown`);
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

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening on port ${PORT}`);
});
