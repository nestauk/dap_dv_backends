import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { redisClient } from './db.mjs';

export const generateToken = () => {
	return crypto.randomBytes(16).toString('hex');
};

export const hashAndSaltToken = async(token, email) => {
	const hash = await bcrypt.hash(token, 10);
	redisClient.set(email, hash);
};

export const doesTokenMatch = async(token, email) => {
	const hash = await redisClient.get(email);
	if (!hash) {
		return false;
	}
	const match = await bcrypt.compare(token, hash);
	return match;
};
