## AI Map Data

This brief README aims to document how the annotations, aggregations and
populated data fields were computed.

### fillMissingData script

The [fillMissingData.mjs script](fillMissingData.mjs) is
used to populate the missing `url` and `description` fields. Making this script
more generic so it could work on any dataset is future work. 

To run this script, you need a valid Bing Search resource and associated API key.

To set up a Bing Search resource you need an azure account and a subscription
(the subscription can be a free tier one and you can use this script using the
free tier Bing Search service too). Once you have a subscription, navigate
to the subscription resource page and click on "Resource providers". There,
you'll see a list of services. Make sure "Microsoft.Bing" is registered, as if
you don't, no pricing tiers appear when creating the Bing Search service.

Once the service has been registered, you can create a Bing Search service and
obtain the neccessary API keys. Export this key to an environment variable
named AZURE_SUBSCRIPTION_KEY and you should be able to run the script directly.

### Ingestion

Once the script has populated the missing data, we first ingest it to an ES
index using the [ingest.mjs](../es/ingest.mjs) script with the
following paramaters (please refer to the commander documentation for more
details about any paramaters in the following node script):

`node src/bin/es/ingest.mjs --index ai_map --path
data/ai_map/data/ai_map_orgs_places_populated.json --list-key orgs --batch-size
100`

### Annotation

Once the data has been ingested to ES, we can run the
[annotation.mjs](../es/annotate.mjs) script:

`node src/bin/es/annotate.mjs --field description --name dbpedia_entities
--index ai_map --page-size 100 --include-metadata`

### Aggregation

And finally to produce the aggregation results, we run the
[aggregate.mjs](../es/aggregate.mjs) script:

`node src/bin/es/aggregate.mjs --index ai_map --path data/ai_map/aggs`