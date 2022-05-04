## `entities_count` filtered by confidence

These aggregations provided statistcs for the
`dbpedia_entities_metatadata.confidence_counts.X` fields. Specifically, these
fields count the number of entities found at the varying degreees of confidence
levels. The request is a multi agg request which provides `extended_stats` and
`histograms` for all 11 possible confidence levels.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html