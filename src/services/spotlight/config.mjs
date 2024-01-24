import * as path from 'path';

import { __dirname } from './service/util.mjs';
import { API_URI_BASE, PROVISION_PORT } from '../config.mjs';

export const spotlightEndpoint = `${API_URI_BASE}/spotlight`;

export const PORT = PROVISION_PORT;
export const WORKER_PORT = 4000;
export const SERVER_DIRECTORY = path.join(__dirname, '..');
export const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');

export const ami = 'ami-06cb614d0f047d106';
export const spotlightInstanceType = 't2.xlarge';

export const scaffold = {
	provider: [
		{
			aws: {
				region: 'eu-west-2',
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
