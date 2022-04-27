## `token_count` normalised by `entities_count`

Provides descriptive statistics on the number of tokens found in the annotated
field, divided by the total number of `dbpedia_entities` produced when annotated.

The aggregations use both `extended_stats` and `histogram`s for the
`entities_count` metadata field.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html