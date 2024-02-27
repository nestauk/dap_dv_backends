import * as configVars from '../../../services/config.mjs';

// Get CONTEXT from the first CLI argument
const server = process.argv[2];

console.log(configVars[`${server}_DOMAIN`])
