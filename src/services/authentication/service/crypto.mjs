import {default as bcrypt} from 'bcryptjs';
import * as crypto from 'crypto';

import { redisClient } from './db.mjs';

export const generateToken = async email => {
	const token = crypto.randomBytes(16).toString('hex');
	const hash = await bcrypt.hash(token, 10);
	const payload = JSON.stringify({
		activated: false,
		hash,
		timestamp: new Date().getTime()
	});

	redisClient.set(email, payload);

	return token;
};

export const activateEmailToken = async (email, token) => {
	const jsonString = await redisClient.get(email);
	const item = JSON.parse(jsonString);
	let wasActivated = false;

	if (item && !item.activated) {
		const match = await bcrypt.compare(token, item.hash);
		if (match) {
			item.activated = true;
			redisClient.set(email, JSON.stringify(item));
			wasActivated = true;
		}
	}
	return wasActivated;
};

export const doesTokenMatch = async (token, email) => {
	const jsonString = await redisClient.get(email);
	const item = JSON.parse(jsonString);
	let match = false;

	if (item?.activated) {
		match = await bcrypt.compare(token, item.hash);
	}
	return match;	
};
