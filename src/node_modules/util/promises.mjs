import { getValue, stringify } from '@svizzle/utils';
import { logger } from 'logging/logging.mjs';

const logErrors = v => {
	if (v.status === 'rejected') {
		logger.error(stringify(v));
	}
	return v;
};

const removeErrors = v => v.status !== 'rejected';

export const promisesHandler = async promises => {
	return (await Promise.allSettled(promises))
	.map(logErrors)
	.filter(removeErrors)
	.map(getValue);
};
