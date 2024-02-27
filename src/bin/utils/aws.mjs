import fs from 'fs';

import {
	CloudFormationClient,
	CreateStackCommand,
	DeleteStackCommand,
	DescribeStackEventsCommand,
	DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import {EC2Client, DescribeImagesCommand} from "@aws-sdk/client-ec2";
import {IAMClient, ListAccessKeysCommand} from "@aws-sdk/client-iam";
import {Route53Client, GetHostedZoneCommand} from "@aws-sdk/client-route-53";
import {S3Client, HeadObjectCommand} from "@aws-sdk/client-s3";
import {stringify} from '@svizzle/utils';
import * as _ from 'lamb';

export const formatParams = _.pipe([
	_.pairs,
	_.mapWith(([key, value]) => ({
		ParameterKey: key,
		ParameterValue: value
	}))
]);

let cfClient;
let ec2Client;
let iamClient;
let r53Client;
let s3Client;

export const initAwsClients = region => {
	cfClient = new CloudFormationClient({region});
	ec2Client = new EC2Client({region});
	iamClient = new IAMClient({region});
	r53Client = new Route53Client({region});
	s3Client = new S3Client({region});
}

export const send = async (client, command) => {
	try {
		const result = await client.send(command);
		return {result};
	} catch (error) {
		return {error};
	}
}

/* CloudFormation */

export const createStack = async (templateFilePath, StackName, Parameters) => {
	const TemplateBody = fs.readFileSync(templateFilePath, 'utf-8');
	return send(cfClient, new CreateStackCommand({
		StackName,
		TemplateBody,
		Parameters,
		Capabilities: ["CAPABILITY_IAM"],
	}));
}
export const deleteStack = async StackName => send(cfClient, new DeleteStackCommand({StackName}));

export const checkStackExists = async stackName => {
	try {
		await cfClient.send(new DescribeStacksCommand({ StackName: stackName }));
		// If the command succeeds, the stack exists
		return true;
	} catch (error) {
		// If a ValidationError is caught, the stack does not exist
		if (error.name !== 'ValidationError') {
			console.error(`Error while checking stack existence: ${stringify(error.stack)}`);
		}
		return false;
	}
}

export const makeFetchStackEvents = (StackName, desiredEvents) => {
	let loggedEventIds = new Set();
	const commandOptions = {StackName};

	return async () => {
		const command = new DescribeStackEventsCommand(commandOptions);
		const {error, result} = await send(cfClient, command);
		if (error) {
			return {error};
		}
		const {StackEvents} = result;
		const events = StackEvents.filter(event =>
			desiredEvents.includes(event.ResourceStatus)
			&& !loggedEventIds.has(event.EventId)
		)
		events.forEach(event => {
			loggedEventIds.add(event.EventId);
		});
		return {events};
	}
}

/* EC2 */
export const checkAmiExists = async (amiId) => {
	try {
		const command = new DescribeImagesCommand({ ImageIds: [amiId] });
		const response = await ec2Client.send(command);
		return new Boolean(response.Images) && response.Images.length > 0;
	} catch (error) {
		return false;
	}
};

/* IAM */
export const getUserAccessKeys = async UserName => send(iamClient, new ListAccessKeysCommand({UserName}));

/* Route 53 */
export const checkHostedZone = async (zoneId, domainName) => {
	const {result, error} = await send(r53Client, new GetHostedZoneCommand({Id: zoneId}));
	if (error) {
		return false;
	}
	return result.HostedZone.Name === `${domainName}.`;
}

/* S3 */
export const checkS3FileExists = async (bucket, key) => {
	const {error} = await send(s3Client, new HeadObjectCommand({Bucket: bucket, Key: key}));
	return !error;
};
