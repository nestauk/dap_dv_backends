export const BASE_DOMAIN = 'dap-tools.uk';

export const API_DOMAIN = `dv-test-api.${BASE_DOMAIN}`;
export const AUTHENTICATION_DOMAIN = `dv-test-authentication.${BASE_DOMAIN}`;
export const ANNOTATE_DOMAIN = `dv-test-annotation.${BASE_DOMAIN}`;
export const PROVISION_DOMAIN = `dv-test-provision.${BASE_DOMAIN}`;

export const API_URI_BASE = `https://${API_DOMAIN}`;
export const AUTHENTICATION_URI_BASE = `https://${AUTHENTICATION_DOMAIN}`;
export const ANNOTATE_URI_BASE = `https://${ANNOTATE_DOMAIN}`;
export const PROVISION_URI_BASE = `http://${PROVISION_DOMAIN}`;

// These are all different ports so that we can eventually run these services
// on the same machine.
export const AUTHENTICATION_PORT = 4001;
export const ANNOTATE_PORT = 4002;
export const PROVISION_PORT = 4003;
