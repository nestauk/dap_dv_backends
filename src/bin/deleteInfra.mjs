import fs from 'fs';

import {
	intro,
	log,
	spinner
} from '@clack/prompts';
import * as _ from 'lamb';

import * as serviceConfig from '../services/config.mjs';

import {
	checkStackExists,
	deleteStack,
	initAwsClients,
	makeFetchStackEvents
} from './utils/aws.mjs';
import {
	logErrorAndExit,
	promptText,
	sleep
} from './utils/misc.mjs';

export const doDeleteStack = async StackName => {
	log.message(`Initiating deletion of stack: ${StackName}`);

	// Initiate stack deletion
	const {error} = await deleteStack(StackName);
	if (error) {
		logErrorAndExit(['Error deleting stack:', error]);
	}
	
	log.message(`Stack deletion initiated for ${StackName}`);

	const s = spinner();
	s.start('Monitoring stack deletion');

	const fetchStackEvents = makeFetchStackEvents(StackName, ['DELETE_COMPLETE']);
	let isDeleteComplete = false;
	while (!isDeleteComplete) {
		const {events, error} = await fetchStackEvents();
		if (error) {
			if (error.Code === 'ValidationError') {
				isDeleteComplete = true;
				break;
			} else {
				s.stop();
				logErrorAndExit(['Error fetching stack events:', error]);
			}
		}

		// Log each new event
		events.forEach(event => {
			log.info(`Resource: ${event.LogicalResourceId}, Status: ${event.ResourceStatus}`);
		});

		// Check if creation is complete
		isDeleteComplete = events.some(_.allOf([
			_.hasKeyValue('ResourceStatus', 'DELETE_COMPLETE'),
			_.hasKeyValue('LogicalResourceId', StackName)
		]));

		if (!isDeleteComplete) {
			await sleep(5000); // Wait for 5 seconds before polling again
		}
	}

	s.stop('Stack deletion completed successfully.');
}

const main = async () => {
	intro('* delete annotation infrastructure *');

	const StackName = fs.existsSync(serviceConfig.CACHE_FILE_PATH)
		? JSON.parse(fs.readFileSync(serviceConfig.CACHE_FILE_PATH)).StackName
		: serviceConfig.STACK_NAME;

	const stackName = await promptText('Input the name of the CloudFormation stack to delete:', StackName);

	initAwsClients(serviceConfig.AWS_REGION);

	if (!await checkStackExists(stackName)) {
		log.message(`Stack ${stackName} does not exist.`);
	} else {
		// TODO if annotations are running, ask for confirmation
		// TODO if annotations are running, request teardown

		doDeleteStack(stackName);
	}
}

main();
