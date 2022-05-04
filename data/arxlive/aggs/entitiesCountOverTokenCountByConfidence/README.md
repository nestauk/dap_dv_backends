## Entities Count by Confidence over `token_count` 

Counts number of entities found at different confidence levels, then normalises
that count using the `token_count`, which is a count of the number of tokens
for the field that was used as input for the annotation process.

Uses `extended_stats` and `histogram` aggs.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html