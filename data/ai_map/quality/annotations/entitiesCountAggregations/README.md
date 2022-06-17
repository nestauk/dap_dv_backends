## Entities Count Aggregations

Aggregations for the `entities_count` field, which is a simple count of the
total number of entities found for that document.

The aggregations use both `extended_stats` and `histogram`s for the
`entities_count` metadata field.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html