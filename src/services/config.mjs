export const BASE_DOMAIN = 'dap-tools.uk';

export const API_DOMAIN = `api.${BASE_DOMAIN}`;
export const AUTHENTICATION_DOMAIN = `authentication.${BASE_DOMAIN}`;
export const ANNOTATION_DOMAIN = `annotation.${BASE_DOMAIN}`;
export const PROVISION_DOMAIN = `provision.${BASE_DOMAIN}`;

export const API_URI_BASE = `https://${API_DOMAIN}`;
export const AUTHENTICATION_URI_BASE = `https://${AUTHENTICATION_DOMAIN}`;
export const ANNOTATION_URI_BASE = `https://${ANNOTATION_DOMAIN}`;
export const PROVISION_URI_BASE = `http://${PROVISION_DOMAIN}`;

// These are all different ports so that we can eventually run these services
// on the same machine.
export const AUTHENTICATION_PORT = 4001;
export const ANNOTATION_PORT = 4002;
export const PROVISION_PORT = 4003;

export const AUTH_EMAIL_DOMAIN = 'nesta.org.uk';

export const SPOTLIGHT_NODE_AMI = 'ami-06cb614d0f047d106';
export const SPOTLIGHT_NODE_SEC_GROUP = 'sg-026313a646e2d8470';

export const AWS_REGION = 'eu-west-2';
