import { Command } from 'commander';

import { buildRequest, makeRequest } from 'es/requests.mjs';

const settings = {
	region: 'eu-west-2',
	bucketName: 'nesta-datavis-arxlive-copy-snapshot',
	snapshotRole: 'arxliveSnapshotRole',
	repository: 'datavis-arxlive-snapshot',
	awsID: '195787726158',
};

const program = new Command();

program
	.command('register')
	.description('Registers new snapshot repository')
	.argument('<domain>', 'domain on which to register snapshot')
	.argument('<repository>', 'repository name')
	.action(async (domain, repository) => {
		const path = `_snapshot/${repository}`;
		const payload = {
			type: 's3',
			settings: {
				bucket: settings.bucketName,
				region: settings.region,
				role_arn: `arn:aws:iam::${settings.awsID}:role/${settings.snapshotRole}`,
			},
		};
		const request = makeRequest(domain, path, 'PUT', payload);
		await makeRequest(request, { verbose: true });
	});

program
	.command('trigger')
	.description(
		'Triggers a manual snapshot given the settings and the input snapshot name'
	)
	.argument('<domain>', 'domain on which to trigger snapshot')
	.argument('<repository>', 'repository name')
	.argument('<snapshot>', 'snapshot name')
	.action(async (domain, repository, snapshot) => {
		const path = `_snapshot/${repository}/${snapshot}`;
		const request = buildRequest(domain, path, 'PUT');
		await makeRequest(request, { verbose: true });
	});

program
	.command('ls')
	.description('Lists repositories or snapshots for a given repository')
	.argument(
		'<domain>',
		'the domain for which to list snapshots or repositories'
	)
	.argument('[repository]', 'the repository for which to list snapshots')
	.action(async (domain, repository) => {
		const path = repository ? `_snapshot/${repository}/_all` : '_snapshot';
		const request = buildRequest(domain, path, 'GET');
		await makeRequest(request, { verbose: true });
	});

program
	.command('restore')
	.description(
		'Restore snapshot to specified domain given in settings in this file'
	)
	.argument('<domain>', 'the domain to which to restore')
	.argument('<repository>', 'repository name')
	.argument('<snapshot>', 'the ID of the snapshot to copy')
	.action(async (domain, repository, snapshot) => {
		const payload = { indices: '-.kibana*,-.opendistro*' };
		const path = `_snapshot/${repository}/${snapshot}/_restore`;
		const request = buildRequest(domain, path, 'POST', payload);

		await makeRequest(request, { verbose: true });
		await main(path, 'POST', settings.newDomain, JSON.stringify(payload));
	});

program
	.command('status')
	.description('Gives the snapshot status for the supplied ES domain')
	.argument('<domain>', 'domain for which to give the status')
	.action(async domain => {
		const path = '_snapshot/_status';
		const request = buildRequest(domain, path, 'GET');
		await makeRequest(request, { verbose: true });
	});

program.parse();
