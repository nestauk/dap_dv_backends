import * as _ from 'lamb';

import { createPathAndWriteObject } from 'dap_dv_backends_utils/util/path.mjs';
import { ami, scaffold, annotationNodeInstanceType } from '../config.mjs';


export const generateConfiguration = async(workers, path=null) => {
	const identifiers = [...Array(workers).keys()];
	const resource = _.map(identifiers, id => (
		{
			aws_instance: [
				{
					[`spotlight-node-${id}`]: [
						{
							ami,
							instance_type: annotationNodeInstanceType,
							key_name: 'spotlight', // [1]
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

/*
This corresponds to the `spotlight` public/private keys pairs for ssh connection
See https://eu-west-2.console.aws.amazon.com/ec2/home?region=eu-west-2#KeyPairs:search=:spotlight;v=3;$case=tags:false%5C,client:false;$regex=tags:false%5C,client:false
*/
