import * as path from 'path';

import {
	API_URI_BASE,
	AWS_REGION,
	PROVISION_PORT,
	SPOTLIGHT_NODE_AMI
} from '../config.mjs';
import {__dirname} from './service/util.mjs';

export const provisionEndpoint = `${API_URI_BASE}/provision`;

export const PORT = PROVISION_PORT;
export const WORKER_PORT = 4000;
export const SERVER_DIRECTORY = path.join(__dirname, '..');
export const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

export const ami = SPOTLIGHT_NODE_AMI;
export const annotationNodeInstanceType = 't2.xlarge';

export const scaffold = {
	provider: [
		{
			aws: {
				region: AWS_REGION,
			},
		},
	],
	terraform: [
		{
			required_providers: [
				{
					aws: {
						source: 'hashicorp/aws',
						version: '~\u003e 4.16',
					},
				},
			],
			required_version: '\u003e= 1.2.0',
		},
	],
};
