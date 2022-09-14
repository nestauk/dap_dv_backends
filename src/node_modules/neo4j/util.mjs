import * as _ from 'lamb';

const resolveValue = value => {
	if (!value || typeof value === 'String') {
		return value;
	}

	const className = value.constructor.name;
	switch (className) {
		case 'Integer':
			return value.toInt();
		case 'Object':
			return _.mapValues(value, resolveValue);
		case 'Array':
			return _.map(value, resolveValue);
		default:
			return value;
	}
};

const parseRecord = record => {
	const fields = _.reduce(
		_.range(0, record.length),
		(acc, idx) => {
			const value = record.get(idx);
			return {
				...acc,
				[record.keys[idx]]: resolveValue(value)
			};
		},
		{}
	);
	return fields;
};

export const promisify = (result, session, driver) => {
	const data = [];
	return new Promise((resolve, reject) => {
		result.subscribe({
			onNext: record => {
				data.push(parseRecord(record));
			},
			onCompleted: () => {
				session.close().then(driver.close());
				resolve(data);
			},
			onError: error => {
				reject(error);
			}
		});
	});
};
