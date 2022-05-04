## Term aggregation of flattened URI values

Counts the occurrences of the `URI` fields in `dbpedia_entities` at different
confidence levels and returns the top 100 most frequent values.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-filter-context.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-terms-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/nested.html