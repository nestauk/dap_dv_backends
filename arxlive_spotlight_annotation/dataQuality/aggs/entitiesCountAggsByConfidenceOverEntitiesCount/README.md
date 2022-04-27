## Entities Count by Confidence over Entities Count

Counts number of entities found at different confidence levels, then normalises
that count using the total count of entities found at all confidence levels.

Uses `extended_stats` and `histogram` aggs.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html