import express from 'express';
import * as path from 'path';

import { setup } from './infrastructure.mjs';
import { destroy } from '../../node_modules/terraform/commands.mjs';

const SERVER_DIRECTORY = 'src/servers/spotlight';
const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

const app = express();
const port = 3000;

app.use(express.json()); // for parsing application/json

app.post('/provision', (req, res) => {
	const { workers=4 } = req.body;
	setup(workers);
	res.status(200).send();
});

app.post('/teardown', (_, res) => {
	destroy(TERRAFORM_DIRECTORY);
	res.status(200).send();
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});


