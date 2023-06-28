export const PORT = 4000;

// TODO: port this to the root service conf file, depends on module-alias package
export const base = 'api.dap-tools.uk';
export const rootAddress = `https://${base}`;
export const annotationEndpoint = `${rootAddress}/annotation`;
export const spotlightEndpoint = `${rootAddress}/spotlight`;
export const internalAnnotationEndpoint = `${spotlightEndpoint}/annotate`;
export const authenticationEndpoint = `${rootAddress}/auth/authenticate`;
export const notificationEmail = 'annotations@dap-tools.uk';
export const MAX_WORKERS=4;
export const dapAnnotationDomain = 'es.annotations.dap-tools.uk';

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `localhost:${PORT}`,
	dev: `${base}/annotate`
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
console.log(BACKEND_BASE);
