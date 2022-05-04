import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'

import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs'

const program = new Command();
program.option(
    '-d, --domain <domain>',
    'ES domain on which to aggregate',
    arxliveCopy
);
program.requiredOption('-i, --index <index>', 'ES index on which to aggregate');
program.requiredOption(
    '-p, --path <path>',
    'Path to directory containing requests'
);
program.option(
    '-o, --out <path>',
    'Path to directory in which to save results. If not set, the results are saved in the same directory as the request object.',
    null
);

program.parse();
const options = program.opts();

const filterDirectory = predicate => _.pipe([
    path => fs.readdirSync(path, { withFileTypes: true }),
    _.filterWith(predicate),
    _.mapWith(_.getKey('name'))
])

const getSubDirectories = filterDirectory(dirEnt => dirEnt.isDirectory())
const getDirFiles = filterDirectory(dirEnt => dirEnt.isFile())

const main = async () => {
    const aggregationDirectories = getSubDirectories(options.path);

    const payloads = await Promise.all(
        _.map(aggregationDirectories, async dir => {
            const subPath = path.join(options.path, dir);
            // if file is generated using script, regenerate
            if (fs.existsSync(path.join(subPath, 'request.mjs'))) {
                exec(`node ${path.join(subPath, 'request.mjs')}`)
            }
            const payload = fs.readFileSync(
                path.join(subPath, 'request.json'), { encoding: 'utf-8' })
            return { name: dir, payload }
        }));

    const responses = await Promise.all(
        _.map(payloads, async ({ name, payload }) => {
            const requestPath = `${options.index}/_search`
            const request = buildRequest(
                options.domain,
                requestPath,
                'POST',
                { payload }
            )
            const { body: response } = await makeRequest(request);
            return { name, payload, response }
        }))

    if (options.out) {
        if (!fs.existsSync(options.out)) {
            fs.mkdirSync(options.out, { recursive: true });
        }
    }
    await Promise.all(
        _.map(responses, async response => {
            const outputPath = options.out
                ? path.join(options.out, `${response.name}.json`)
                : path.join(options.path, response.name, 'response.json')
            fs.writeFileSync(
                outputPath, 
                JSON.stringify(response.response, null, 4)
            )
        }));
};

main();
