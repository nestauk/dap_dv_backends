import { InvalidArgumentError } from 'commander';

export const commanderParseInt = (value, _) => {
	const parsedValue = parseInt(value, 10);
	if (isNaN(parsedValue)) {
		throw new InvalidArgumentError('Not an integer.');
	}
	return parsedValue;
};
