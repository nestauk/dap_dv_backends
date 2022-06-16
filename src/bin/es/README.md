## ElasticSearch Scripts

### [aggregate.mjs](aggregate.mjs)

```
Usage: aggregate [options]

Options:
  -d, --domain <domain>  ES domain on which to aggregate
  -i, --index <index>    ES index on which to aggregate
  -p, --path <path>      Path to directory containing requests
  -o, --out <path>       Path to directory in which to save results. If not set,
                         the results are saved in the same directory as the 
                         request object. (default: null)
  -h, --help             display help for command
```

Script used to perform automatic aggregations on a given domain/index. The `-p,
--path` paramater is used to point the script to a directory where the requests
are stored, which is needed as different indices/annotation sources will require
specific requests, depending on which fields where used as input to the
annotation process. If the output directory is not explictily provided using
`-o, --out`, the results are saved in the same directory as where the requests
are stored, otherwise the responses are stored using a flat directory structure
and having the same name as the aggregation request used to perform the
analysis.

### [annotate.mjs](annotate.mjs)

```
Usage: annotate [options]

Options:
  -d, --domain <domain>              ES domain on which to annotate
  -i, --index <index>                Index on which to annotate (default: "test")
  -s, --spotlight <endpoint>         Endpoint for spotlight annotator
  -f, --field <field>                Field of doc to be used as input text for annotation
  -n, --name <annotated_field_name>  Name of new field to be created (default: "dbpedia_entities")
  -p, --page-size <page size>        Size of page to scroll with (default: 10000)
  -z, --pages <number of pages>      Number of pages to iterate over (default: "all")
  -b, --batch-size <batch size>      Size of batch to annotate over (default: 10)
  --force                            Force the annotation process, even if no snapshots can be created
  --include-metadata                 Include metadata fields on the index
  -h, --help                         display help for command
```

Script used to perform the annotation process. Essentially this script will perform
Spotlight annotation on a given ElasticSearch domain/index. The script requires
a paramater for which field to use as input to the annotation process `-f, --field`,
an optional name for the output field on the ES index `-n, --name`, and the URL
pointing to the spotlight REST API endpoint `-s, --spotlight`.

There are a few other paramaters which affect processing and computational
resource allocation.

`-p, --page-size` determines how many documents to retrieve from the
domain/index per request. If there are 100K documents, and the page size is set
to 1'000, then there will be 100'000 / 1'000 = 100 bulk GET requests made (using
the scroll API) to the ES endpoint. Setting this value to as large as possible
is advantageous as it removes less network overhead, however it also means that
the bulk update reqeusts also become much larger. At a certain point, these
start to fail as ElasticSearch will refuse bulk requests over a certain size
limit. The default value here seems to work reasonably well.

`-z, --pages` determines how many `pages` to iterate over using the scroll API.
Typically you'll want to annotate all documents on an index, but if for some
reason you wish to only annotate the first 5K documents, you could set the `-p,
--page-size` paramater to 500 and `-z, --pages` paramater to 10, and this will
only iterate and annotate the desired first 5K documents for you.

`-b, --batch-size` determines how many documents to asynchronously annotate at
once. For example, if set to 10, then 10 requests are "bursted" at once to the
provided Spotlight endpoint and each response is awaited as part of a
`Promise.all`. This is particularly advantageous if the Spotlight tool has been
set up with multiple containers and orchestrated behind a load balancer (which
is what the [spotlight setup script](../spotlight/setup.sh) attempts to perform)
as we can reduce I/O and network overhead by performing multiple requests
simulataneously. If this paramater is set too high, the effect will become
negligible as the requests will still have to queue for resources. If set much
too high, the process will fail due to the Spotlight REST API becoming
overwhelmed by requests and shutting down. The best advice here is to set this
paramater in relation to how many containers are running on the endpoint instance.
The more containers, the more safely you can increase batch size.

`--force` is a boolean flag used to direct the annotation process to continue
in the event that either the snapshot process (which automatically saves the
state of the index before any modifications or chages to the data on the index
occur) cannot complete, or if the output fields are found to already exist. In
the latter case, the annotation script will prevent you from overwriting exiting
annotation data, and you must provide the `--force` flag to do so.

`--include-metadata` is a boolean flag used to specify whether you also want to
include metadata about the annotation process and the annotation data itself.
This metadata is needed in order to perform the aggregations which provide
statisical analysis on the annotated index and which are useful to measure data
quality.

### [document.mjs](document.mjs)

```
Usage: document [options] [command]

Options:
  -h, --help                       display help for command

Commands:
  create [options] <index> <path>  creates a document
  help [command]                   display help for command
```

#### `create`

```
Usage: document create [options] <index> <path>

creates a document

Arguments:
  index                  index on which to create document
  path                   path to document(s). If more than one document, root level JSON must
                         be an array of objects. If an object has a root level key of 'id',
                         this will be used as the documents id on ElasticSearch

Options:
  -d, --domain <domain>  domain on which to create document
  -h, --help             display help for command
```

There is really only one command for the document scrip as of writing: `create`.
The `create` script creates either a document or multiple documents, depending
on whether the input data's root element is a single JSON object or an array.
The user must specify the index an optional domain (there is a default for
internal use) on which to create these documents.

The `<path>` argument specifies whhere the JSON file containing the document(s)
are. The script reads and parses these documents then creates them on the index.
If an object has a root level key of 'id', this will be used as the documents id
on ElasticSearch

### [dump.mjs](dump.mjs)

```
Usage: dump [options]

Options:
  -d, --domain <domain>  ES domain on which to aggregate
  --indent <value>       Whether to use an indent for the outputted JSON, and 
                         if so, how many spaces (default: 0)
  -i, --index <index>    ES index on which to aggregate
  -o, --out <path>       Path to directory in which to save results.
  -h, --help             display help for command
```

The dump script downloads an entire ElasticSearch index to a JSON file. Supply
the domain and index to download, and the output path for the saved result. 
The user can also specify the level of indentation (if any) for the resulting
JSON file.


### [index.mjs](index.mjs)

```
Usage: index [options] [command]

Options:
  -h, --help                                  display help for command

Commands:
  create [options] <index> [domain]           creates an index
  delete <index> [domain]                     deletes an index
  reindex [options] <source> <dest> [domain]  copies one index to another
  help [command]                              display help for command
```

Script for running index related REST commands such as creating, deleting and
reindexing ElasticSearch indices.

#### `create`

```
Usage: index create [options] <index> [domain]

creates an index

Arguments:
  index              index name
  domain             domain on which to create index

Options:
  -p, --path <path>  path to payload for settings (default: null)
  -h, --help         display help for command
```

Creates an index with the supplied name at the given domain. The user can
optionally specify an path to a JSON file with settings for index such as 
specific analysers and explicit ElasticSearch mappings (any valid payload used
for the index REST command can be supplied here).

#### `delete`

```
Usage: index delete [options] <index> [domain]

deletes an index

Arguments:
  index       index name
  domain      domain where index is hosted

Options:
  -h, --help  display help for command
```

Deletes the index with the supplied name at the supplied domain.

#### `reindex`

```
Usage: index reindex [options] <source> <dest> [domain]

copies one index to another

Arguments:
  source                 source index
  dest                   destination index
  domain                 domain where index is hosted

Options:
  --ignore <fields...>   fields to ignore upon reindex. These fields will not 
                         be copied over to the new index.
  --max-docs <docs>      number of documents to copy (default: "all")
  --proceed-on-conflict  whether to proceed on conflict or abort
  -h, --help             display help for command
```

Script to use a simplified ElasticSearch reindex API, where you can copy
one index to another with various filters and optional paramaters. The script
takes the name of the source index, the name of the index to be created and the
domain on which the copy is to take place.

`--ignore` takes a space delimited list of fields which will not be copied to 
the new index

`--max-docs` if specified will only copy the supplied number of documents.

`--proceed-on-conflict` will tell the script to continue if conflicts arise,
e.g. if a document with the same id already exists on the destination index.


### [query.mjs](query.mjs)

```
Usage: query [options] [command]

Options:
  -h, --help              display help for command

Commands:
  query <query> [domain]  Queries the endpoint
  help [command]          display help for command
```

Very simple script which leverages an extremely simplified ES query API.

#### `query`

```
Usage: query query [options] <query> [domain]

Queries the endpoint

Arguments:
  query       query term
  domain      domain on which to query

Options:
  -h, --help  display help for command
```

Accepts a query term and the domain on which to query and will return the
response.

### [snapshot.mjs](snapshot.mjs)

```
Usage: snapshot [options] [command]

Options:
  -h, --help                                display help for command

Commands:
  register <domain> <repository>            Registers new snapshot repository
  trigger <domain> <repository> <snapshot>  Triggers a manual snapshot given the settings and the input snapshot name
  ls <domain> [repository]                  Lists repositories or snapshots for a given repository
  restore <domain> <repository> <snapshot>  Restore snapshot to specified domain given in settings in this file
  status <domain>                           Gives the snapshot status for the supplied ES domain
  help [command]                            display help for command
```

Script for using the ElasticSearch snapshot API. The commands here are
relatively self explanatory given you have read the snapshot documentation, 
which can be found [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html)