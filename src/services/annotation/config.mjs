import {
	API_DOMAIN,
	ANNOTATION_PORT,
	BASE_DOMAIN
} from "../config.mjs";

export const PORT = ANNOTATION_PORT;

// TODO: port this to the root service conf file, depends on module-alias package
export const base = API_DOMAIN;
export const rootAddress = `https://${base}`;
export const annotationEndpoint = `${rootAddress}/annotation`;
export const provisionEndpoint = `${rootAddress}/provision`;
export const internalAnnotationEndpoint = `${provisionEndpoint}/annotate`;
export const authenticationEndpoint = `${rootAddress}/auth/authenticate`;
export const notificationEmail = `annotations@${BASE_DOMAIN}`;
export const MAX_WORKERS = 4;
export const dapAnnotationDomain = `es.annotations.${BASE_DOMAIN}`;

// eslint-disable-next-line no-process-env
const nodeEnv = process.env.NODE_ENV || 'development';

const BACKEND_BASES = {
	development: `localhost:${PORT}`,
	dev: `${base}/annotation`
};

export const BACKEND_BASE = BACKEND_BASES[nodeEnv];
console.log(BACKEND_BASE);

export const ANNOTATIONS_EMAIL = `annotations@${BASE_DOMAIN}`;
