## Histogram of flattened `similarityScore` values

Aggregates all `similarityScore` values into a histogram, each bucket having an
interval of 0.1. Flattened here denotes the fact that all annotated entities are
treated as a flat list - no per document analysis is performed.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/nested.html
