import { promises as fs } from 'fs';

import { Command } from 'commander';
import * as _ from 'lamb';

import { arxliveCopy } from 'conf/config.mjs';
import { bulkRequest } from 'es/bulk.mjs';
import { createIndex } from 'es/index.mjs';
import { logger } from 'logging/logging.mjs';
import { batch } from 'util/array.mjs'; 
import { commanderParseInt } from 'util/commander.mjs';

const program = new Command();
program.option(
    '-d, --domain <domain>',
    'ES domain on which to ingest documents',
    arxliveCopy
);
program.requiredOption('-i, --index <index>', 'Index on which to ingest');
program.requiredOption('-p, --path <path>', 'Path to JSON data');
program.option('--batch-size <size>', 'Size of batch of docs to upload', commanderParseInt, 100)
program.option(
    '--key <key>',
    'Top level key in JSON object to use as key. If not supplied, keys will be generated automatically',
    null
);
program.option(
    '--list-key <key>',
    'Key for the documents if documents are stored as a value at the root level of the json file. Not recommended',
    null
);

program.parse();
const options = program.opts();

const logErrors = _.pipe([
    _.filterWith(item => parseInt(item.create.status/100) !== 2),
    _.mapWith(logger.error)
])

const main = async () => {

    await createIndex(options.index, options.domain)

    const json = JSON.parse(
        await fs.readFile(options.path, { encoding: 'utf-8' })
    );
    const data = options.listKey ? json[options.listKey] : json;

    const documents = options.key
        ? _.map(data, object => {
            const { [options.key]: id, ...data } = object;
            return { id, data };
        })
        : _.map(data, (data, id) => ({ id, data }))

    const docsWithId = _.filter(documents, doc => doc.id)
    for (const docs of batch(docsWithId, options.batchSize)) {
        const response = await bulkRequest(options.domain, options.index, docs, 'create');
        logErrors(response.items)
    };
};

main();
