export const PORT = 4000;

export const terraformServerAddress = "http://3.8.192.33";
export const annotationEndpoint = new URL('annotate', terraformServerAddress);

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `http://localhost:${PORT}`,
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
