import fs from 'fs';

import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	spinner
} from '@clack/prompts';
import {stringify} from '@svizzle/utils';
import * as _ from 'lamb';

import * as serviceConfig from '../services/config.mjs';

import {
	checkAmiExists,
	checkHostedZone,
	checkS3FileExists,
	createStack,
	formatParams,
	getUserAccessKeys,
	initAwsClients,
	makeFetchStackEvents
} from './utils/aws.mjs';
import {
	allAreNonEmptyStrings,
	getUrlStatuses,
	logErrorAndExit,
	makeRenameKeysWithMap,
	promptText,
	sleep,
} from './utils/misc.mjs';

const TEMPLATE_FILE_PATH = 'src/templates/cloudFormation.yaml';
const CF_EVENTS = [
	'CREATE_COMPLETE',
	'CREATE_FAILED',
	'ROLLBACK_COMPLETE',
	'ROLLBACK_FAILED'
];
const CONFIG_CONSTS = [
	'ANNOTATION_DOMAIN',
	'API_DOMAIN',
	'AUTHENTICATION_DOMAIN',
	'AWS_REGION',
	'HOSTED_ZONE_ID',
	'PROVISION_DOMAIN',
	'REPO_URL',
	'SPOTLIGHT_CERT_S3_URI'
];
const CONFIG_NAME_MAPPING = {
	AWS_REGION: 'AwsRegion',
	HOSTED_ZONE_ID: 'HostedZoneId',
	REPO_URL: 'RepoUrl',
	ANNOTATION_DOMAIN: 'AnnotationDomainName',
	API_DOMAIN: 'ApiDomainName',
	AUTHENTICATION_DOMAIN: 'AuthenticationDomainName',
	PROVISION_DOMAIN: 'ProvisionDomainName',
	SPOTLIGHT_CERT_S3_URI: 'SpotlightCertS3Uri'
};

const deployTemplate = async (templateFilePath, StackName, region, configuration) => {
	log.message(`Started ${StackName} deployment:`);

	const templateParams = formatParams(configuration);

	const {result: stackInfo, error} = await createStack(templateFilePath, StackName, templateParams);
	if (error) {
		logErrorAndExit(['Error creating stack:', error]);
	}

	log.info(`Stack creation initiated: ${stackInfo.StackId}`);

	const s = spinner();
	s.start('Monitoring stack creation');

	const fetchNewStackEvents = makeFetchStackEvents(StackName, CF_EVENTS);
    let isCreateComplete = false;
	while (!isCreateComplete) {
        const {events, error} = await fetchNewStackEvents();
        if (error) {
            s.stop();
            logErrorAndExit(['Error fetching stack events:', error]);
        }

        // Log each new event
        events.forEach(event => {
            log.info(`Resource: ${event.LogicalResourceId}, Status: ${event.ResourceStatus}`);
        });

        // Check if creation is complete
        isCreateComplete = events.some(_.allOf([
			_.hasKeyValue('ResourceStatus', 'CREATE_COMPLETE'),
			_.hasKeyValue('LogicalResourceId', StackName)
		]));

        if (!isCreateComplete) {
            await sleep(5000); // Wait for 5 seconds before polling again
        }
    }

	s.stop('Infrastructure deployed successfully');

	const s1 = spinner();
	s1.start('Checking that services are ready');
	await getUrlStatuses(
		// see `nginx/nginx.proxy.template.conf` for the following paths
		[
			`${serviceConfig.API_URI_BASE}/annotation/status`,
			`${serviceConfig.API_URI_BASE}/auth/static/index.html`,
			`${serviceConfig.API_URI_BASE}/provision/state`,
		],
		5000
	);

	s1.stop('Services are ready');
}

const main = async () => {
	const cachedConfig = fs.existsSync(serviceConfig.CACHE_FILE_PATH)
		? JSON.parse(fs.readFileSync(serviceConfig.CACHE_FILE_PATH))
		: {
			AwsUsername: serviceConfig.AWS_USERNAME,
			CertbotEmail: serviceConfig.CERTBOT_EMAIL,
			RepoBranch: serviceConfig.REPO_BRANCH,
			StackName: serviceConfig.STACK_NAME
		};

 	initAwsClients(serviceConfig.AWS_REGION);

	intro('* create annotation infrastructure *');

	log.message('Checking for existence of hosted zone');
	const doesR53ZoneExist = await checkHostedZone(serviceConfig.HOSTED_ZONE_ID, serviceConfig.BASE_DOMAIN);
	if (!doesR53ZoneExist) {
		logErrorAndExit(['The hosted zone ID does not exist or its domain name does not match the base domain.']);
	}

	log.message('Checking for existence of certificate file');
	const doesS3FileExist = await checkS3FileExists(serviceConfig.SPOTLIGHT_CERT_BUCKET_NAME, serviceConfig.SPOTLIGHT_CERT_KEY);
	if (!doesS3FileExist) {
		logErrorAndExit([`The certificate file "${serviceConfig.SPOTLIGHT_CERT_KEY}" does not exist in the specified S3 bucket.`]);
	}

	log.message('Checking for existence of AMI');
	const doesAmiExist = await checkAmiExists(serviceConfig.SPOTLIGHT_NODE_AMI);
	if (!doesAmiExist) {
		logErrorAndExit(['The AMI specified in the configuration does not exist. PLease ensure that the annotator AMI is available in the specified region.']);
	}

	const dynamicConfiguration = {
		AwsUsername: await promptText('Input AWS userName with which to create access keys:', cachedConfig.AwsUsername),
		CertbotEmail: await promptText('Input email address to receive certbot notifications:', cachedConfig.CertbotEmail),
		RepoBranch: await promptText('Input the branch of the npm package to install:', cachedConfig.RepoBranch),
		StackName: await promptText('Input the name of the CloudFormation stack to create:', cachedConfig.StackName)
	};

	const fullConfiguration = {
		..._.pipe([
			_.pick(CONFIG_CONSTS),
			makeRenameKeysWithMap(CONFIG_NAME_MAPPING)
		])(serviceConfig),
		..._.skipIn(dynamicConfiguration, ['StackName'])
	};

	log.info(`Configuration:\n${stringify(fullConfiguration)}`);

	// Additional check for empty values in dynamicConfiguration
	const allValuesProvided = allAreNonEmptyStrings(dynamicConfiguration);

	if (!allValuesProvided) {
		logErrorAndExit(['All configuration fields must be provided and not empty.']);
	}
	
	log.message('Checking for availability of user access keys');
	const {result:accessKeys, error} = await getUserAccessKeys(dynamicConfiguration.AwsUsername);
 	if (error) {
		logErrorAndExit(['Error fetching user access keys length:', error]);
	}
	if (accessKeys.AccessKeyMetadata.length >= 2) {
		logErrorAndExit(['User already has 2 access keys. Please delete one before proceeding.']);
	}

	// Proceed with confirmation and deployment if all checks pass
	const confirmResult = await confirm({ message: 'Do you want to proceed with deployment?' });
	if (isCancel(confirmResult)) {
		cancel('Operation cancelled');
		process.exit(0);
	}

	if (confirmResult) {
		fs.writeFileSync(serviceConfig.CACHE_FILE_PATH, stringify(dynamicConfiguration));

 		deployTemplate(
			TEMPLATE_FILE_PATH,
			dynamicConfiguration.StackName,
			serviceConfig.AWS_REGION,
			fullConfiguration
		);
	} else {
		cancel('Operation cancelled');
	}
}

main();
