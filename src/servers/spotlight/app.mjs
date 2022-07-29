import express from 'express';
import * as path from 'path';

import { setup } from './infrastructure.mjs';
import { displayCommandOutput } from 'util/shell.mjs';
import { destroy } from '../../node_modules/terraform/commands.mjs';
import { state } from './state.mjs';
import { getCurrentState } from '../../node_modules/terraform/state.mjs';

const SERVER_DIRECTORY = 'src/servers/spotlight';
const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

const app = express();
const port = 3000;


app.use(express.json()); // for parsing application/json

app.post('/provision', (req, res) => {
	const { workers=4 } = req.body;
	state.status = { status: 'scheduling', workers };
	setup(workers);
	res.send();
});

app.get('/teardown', (_, res) => {
	state.status = { status: 'destroying' };
	const callback = (err, stdout, stderr) => {
		state.status = { status: 'down' };
		return displayCommandOutput(err, stdout, stderr);
	};
	destroy(TERRAFORM_DIRECTORY, callback);
	res.send();
});

app.get('/state', async (_, res) => {
	const terraformState = await getCurrentState(TERRAFORM_DIRECTORY);
	res.send(terraformState);
});

app.get('/status', (_, res) => {
	res.send(state.status);
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});


