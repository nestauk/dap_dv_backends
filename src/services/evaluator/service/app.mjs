import cors from 'cors';
import express from 'express';

import { serverPort } from '../config.mjs';
import { redisClient } from './db.mjs';
import {
	getNextOrgIdsForUser,
	getOrgById,
	getOrgWithValidEntities,
	saveEvaluation,
} from './logic.mjs';


const app = express();

/* middleware */

app.use(cors());
app.use(express.json()); // for parsing application/json

/* endpoints */

app.post('/next_ids', async (req, res) => {
	const { userId, chunkSize } = req.body;
	const documentsEvaluated = await redisClient.sMembers(userId);
	const orgIds = getNextOrgIdsForUser(documentsEvaluated, chunkSize);

	res.status(200).send({orgIds});
});

app.post('/next_org', async (req, res) => {
	const { userId } = req.body;
	const documentsEvaluated = await redisClient.sMembers(userId);
	const [ orgId ] = getNextOrgIdsForUser(documentsEvaluated, 1);
	const org = await getOrgById(orgId);
	const filteredOrg = getOrgWithValidEntities(org);

	res.status(200).send({org: filteredOrg});
});

app.post('/eval/:orgId', async (req, res) => {
	const { userId, topics } = req.body;
	const code = await saveEvaluation(userId, req.params.orgId, topics);

	if (code === 200 || code === 201) {
		await redisClient.sAdd(userId, req.params.orgId);
	}

	res.status(code).send({});
});

app.get('/orgs/:orgId', async(req, res) => {
	const org = await getOrgById(req.params.orgId);

	res.status(200).send({org});
});

app.listen(serverPort, () => {
	console.log(`Listening on port ${serverPort}`);
});
