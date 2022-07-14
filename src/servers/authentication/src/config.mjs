export const PORT = 4000;

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `http://localhost:${PORT}`,
	dev: 'https://authentication.dap-tools.uk'
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
