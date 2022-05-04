# Cloud

## AWS

### ElasticSearch

The `elasticsearch` directory contains a list of subdirectories corresponding
to domains hosted on Nesta's AWS account. There are four domains currently
being configured:

- `dap_dv_tmp`: Domain for temporary development. Used for either
temporary storage of data while we use ES for aggregations, or exploratory work.
Data stored here should not be expected to remain long. Essentially ephemeral
storage.
- `dap_dv_dev`: Domain for development work. Exploration and tinkering goes on
here.
- `dap_dv_staging`: Staging domain.
- `dap_dv_prod`: Production domain - data hosted here is served to apps in 
production.

Each subdirectory corresponds to an index being hosted on that domain, e.g.
`dap_dv_dev/arxlive` means there is an index named `arxlive` hosted on the 
`dap_dv_dev` domain. Each index directory contains two files:

- `mapping.json`
- `snapshots.json`

The `mapping.json` file contains the current and most recent mapping for that
index. We allow Git to track this files changes in order to examine the history
of changes to a mapping for any particular index.

`snapshots.json` contains a list of objects corresponding to snapshots made on
that index. Each snapshot corresponds to changes made to the indices mapping,
data or both. A description for the snapshot is given in the object. You can
use that objects snapshot id along with the domain on which the snapshot was
taken to clone the index at that point in time.