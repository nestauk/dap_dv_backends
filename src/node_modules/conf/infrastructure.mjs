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
