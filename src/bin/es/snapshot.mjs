import { Command } from 'commander';

import * as snapshotAPI from 'es/snapshot.mjs';

const program = new Command();

program
	.command('register')
	.description('Registers new snapshot repository')
	.argument('<domain>', 'domain on which to register snapshot')
	.argument('<repository>', 'repository name')
	.action(async (domain, repository) => {
		await snapshotAPI.register(domain, repository);
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
		await snapshotAPI.trigger(domain, repository, snapshot);
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
		await snapshotAPI.list(domain, repository);
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
		await snapshotAPI.restore(domain, repository, snapshot);
	});

program
	.command('status')
	.description('Gives the snapshot status for the supplied ES domain')
	.argument('<domain>', 'domain for which to give the status')
	.action(async domain => {
		await snapshotAPI.status(domain);
	});

program.parse();
