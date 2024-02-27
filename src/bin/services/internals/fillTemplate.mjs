import {program} from 'commander';

import {processAndSaveTemplate} from '../../../utils/template.mjs';

// Dynamically import replacement variables
const loadVariables = async path => {
	try {
		const varsModule = await import(path);
		return varsModule.default || varsModule;
	} catch (err) {
		console.error('Error importing variables module:', err);
		process.exit(1);
	}
};

const reduceKeyValue = (value, previous) => {
	const [key, val] = value.split('=');
	previous[key] = val;
	return previous;
};

program
	.version('1.0.0')
	.description('A script to process a template file with variables from a config file and save the output')
	.requiredOption('-t, --template <path>', 'Path to the template file')
	.requiredOption('-o, --output <path>', 'Path to save the output file')
	.requiredOption('-p, --varspath <path>', 'Path to the .mjs file with replacement variables')
	.option('-cpvar, --copy-var <string>', 'Copy an existing property to a new property in the format NEW_VAR=EXISTING_VAR', reduceKeyValue, {})
	.parse(process.argv);

const options = program.opts();

const run = async () => {
	const loadedVars = await loadVariables(options.varspath);
	const replacedVars = {};
	for (const [key, value] of Object.entries(options.copyVar)) {
		replacedVars[key] = loadedVars[value];
	}

	// Merge CLI provided variables with replacementVars
	const replacementVars = {
		...loadedVars,
		...replacedVars
	};

	// Process template
	processAndSaveTemplate(options.template, replacementVars, options.output);
};

run();
