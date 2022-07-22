export const displayCommandOutput = (
	error,
	stdout,
	stderr,
	{ warnings=false } = {}
) => {
	if (error) {
		console.log(`error: ${error.message}`);
		return;
	}
	if (stderr) {
		if (stderr.toLowerCase().startsWith('warning') && !warnings) {
			return;
		}
		console.log(`stderr: ${stderr}`);
		return;
	}
	if (stdout.length > 0) {
		console.log(`stdout: ${stdout}`);
	}
};
