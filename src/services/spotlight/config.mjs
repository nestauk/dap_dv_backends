import * as path from 'path';

import { __dirname } from './service/util.mjs';


export const SERVER_DIRECTORY = path.join(__dirname, '..');
export const TERRAFORM_DIRECTORY = path.join(SERVER_DIRECTORY, 'terraform');
