import { authenticate, parseBasicAuth } from './auth.mjs';

const respondWithAuthError = (res, message, code) => {
	res.statusCode=401;
	res.setHeader('Content-Type', 'application/json');
	res.write(JSON.stringify({ error: message, code }));
	res.end();
};

export const authenticationMiddleware = async(req, res, next) => {
	if (!('authorization' in req.headers)) {
		respondWithAuthError(
			res,
			'No Authorization Header set',
			100
		);
		return;
	}
	const authHeader = req.headers.authorization;
	if (!authHeader.startsWith('Basic')) {
		respondWithAuthError(
			res,
			'Basic Authorization Header required',
			101
		);
		return;
	}
	const { email, token } = parseBasicAuth(authHeader);
	const isAuthorized = await authenticate(email, token);
	if (!isAuthorized) {
		respondWithAuthError(
			res,
			'Email and Token supplied cannot be authenticated',
			102
		);
		return;
	}
	next();
};
