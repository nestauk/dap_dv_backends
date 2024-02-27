/* config */
export const STACK_NAME = 'annotator-system';

export const AUTH_EMAIL_DOMAIN = 'nesta.org.uk';

export const BASE_DOMAIN = 'dap-tools.uk';
export const HOSTED_ZONE_ID = 'Z04340481208XPK7762Z9';
export const ANNOTATION_SUBDOMAIN = 'annotation';
export const API_SUBDOMAIN = 'api';
export const AUTHENTICATION_SUBDOMAIN = 'authentication';
export const PROVISION_SUBDOMAIN = 'provision';

export const AWS_REGION = 'eu-west-2';
export const SPOTLIGHT_NODE_AMI = 'ami-06cb614d0f047d106';
export const SPOTLIGHT_NODE_SEC_GROUP = 'sg-026313a646e2d8470';
export const SPOTLIGHT_CERT_BUCKET_NAME = 'dap-dv-backends';
export const SPOTLIGHT_CERT_KEY = 'spotlight.pem'; // this file will be renamed to `spotlight.pem` in the EC2 instance

export const REPO_URL = 'https://github.com/nestauk/dap_dv_backends.git';
export const REPO_BRANCH = 'dev';

// These values are private and are declared here for reference only.
// Fill them out when prompted running deployInfra.mjs
export const AWS_USERNAME = '';
export const CERTBOT_EMAIL = '';

// These are all different ports so that we can eventually run these services
// on the same machine.
export const AUTHENTICATION_PORT = 4001;
export const ANNOTATION_PORT = 4002;
export const PROVISION_PORT = 4003;

/* setup paths */
export const CACHE_FILE_PATH = 'configCache.json';

/* derived constants */

export const ANNOTATION_DOMAIN = `${ANNOTATION_SUBDOMAIN}.${BASE_DOMAIN}`;
export const API_DOMAIN = `${API_SUBDOMAIN}.${BASE_DOMAIN}`;
export const AUTHENTICATION_DOMAIN = `${AUTHENTICATION_SUBDOMAIN}.${BASE_DOMAIN}`;
export const PROVISION_DOMAIN = `${PROVISION_SUBDOMAIN}.${BASE_DOMAIN}`;

export const API_URI_BASE = `https://${API_DOMAIN}`;
export const AUTHENTICATION_URI_BASE = `https://${AUTHENTICATION_DOMAIN}`;
export const ANNOTATION_URI_BASE = `https://${ANNOTATION_DOMAIN}`;
export const PROVISION_URI_BASE = `http://${PROVISION_DOMAIN}`;

export const SPOTLIGHT_CERT_S3_URI = `s3://${SPOTLIGHT_CERT_BUCKET_NAME}/${SPOTLIGHT_CERT_KEY}`;
