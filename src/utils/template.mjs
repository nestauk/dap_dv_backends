import fs from 'fs';

const replaceVariables = (template, variables) => template.replace(
	/\$\{([^}]+)\}/g,
	(match, name) => variables[name] || ''
);

export const processAndSaveTemplate = (templatePath, variables, outputPath) => {
	fs.readFile(templatePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading the template file:', err);
			return;
		}

		const processedTemplate = replaceVariables(data, variables);
		fs.writeFile(outputPath, processedTemplate, 'utf8', err => {
			if (err) {
				console.error('Error writing to the output file:', err);
				return;
			}
			console.log(`Processed template saved to ${outputPath}`);
		});
	});
};
