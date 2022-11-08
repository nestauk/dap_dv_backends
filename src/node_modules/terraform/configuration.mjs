import * as _ from 'lamb';

import { createPathAndWriteObject } from 'util/path.mjs';
import { ami, scaffold, spotlightInstanceType } from 'conf/infrastructure.mjs';


export const generateConfiguration = async(workers, path=null) => {
	const identifiers = [...Array(workers).keys()];
	const resource = _.map(identifiers, id => (
		{
			aws_instance: [
				{
					[`spotlight-node-${id}`]: [
						{
							ami,
							instance_type: spotlightInstanceType,
							key_name: 'spotlight',
							vpc_security_group_ids: ['sg-026313a646e2d8470'],
							tags: {
								Name: `spotlight-node-${id}`,
							},
						},
					],
				},
			],
		}
	));
	const output = _.map(identifiers, id => (
		{
			[`spotlight-node-${id}-public_ip`]: [
				{
					"value": `\${aws_instance.spotlight-node-${id}.public_ip}`
				}
			]
		}
	));
	const configuration = {
		...scaffold,
		output,
		resource
	};

	if (path) {
		await createPathAndWriteObject(path, configuration);
	}
	return configuration;
};

