export const PORT = 4000;

export const spotlightEndpoint = "https://api.dap-tools.uk/spotlight";
export const annotationEndpoint = `${spotlightEndpoint}/annotate`;
export const authenticationEndpoint = 'https://api.dap-tools.uk/auth/authenticate';
export const notificationEmail = 'annotations@dap-tools.uk';
export const MAX_WORKERS=4;

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `http://localhost:${PORT}`,
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
