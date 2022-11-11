import * as path from 'path';

import { __dirname } from './service/util.mjs';

export const spotlightEndpoint = "https://api.dap-tools.uk/spotlight";

export const PORT = 3000;
export const WORKER_PORT = 4000;
export const SERVER_DIRECTORY = path.join(__dirname, '..');
export const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');
