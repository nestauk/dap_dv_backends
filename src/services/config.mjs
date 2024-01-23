export const BASE_DOMAIN = 'dap-tools.uk';

export const API_DOMAIN = `dv-test-api.${BASE_DOMAIN}`;
export const AUTH_DOMAIN = `dv-test-authentication.${BASE_DOMAIN}`;
export const ANNOTATE_DOMAIN = `dv-test-annotation.${BASE_DOMAIN}`;
export const SPOTLIGHT_DOMAIN = `dv-test-spotlight.${BASE_DOMAIN}`;

export const API_URI_BASE = `https://${API_DOMAIN}`;
export const AUTH_URI_BASE = `https://${AUTH_DOMAIN}`;
export const ANNOTATE_URI_BASE = `https://${ANNOTATE_DOMAIN}`;
export const SPOTLIGHT_URI_BASE = `http://${SPOTLIGHT_DOMAIN}`;

// These are all different ports so that we can eventually run these services
// on the same machine.
export const AUTH_PORT = 4001;
export const ANNOTATE_PORT = 4002;
export const SPOTLIGHT_PORT = 4003;
