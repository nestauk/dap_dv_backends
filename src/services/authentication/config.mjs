import * as dotenv from 'dotenv';
import { API_DOMAIN, BASE_DOMAIN, AUTH_PORT } from '../config.mjs';

dotenv.config({ path: 'src/services/authentication/.env'});

// eslint-disable-next-line no-process-env
export const PORT = AUTH_PORT;

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `localhost:${PORT}`,
	dev: `${API_DOMAIN}/auth`
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
export const SOURCE_EMAIL = `authenticate@${BASE_DOMAIN}`;
