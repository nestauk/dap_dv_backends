## Flattened `similarityScore` Extended Stats

Produces a number of different statistical measures such as average, STD, min,
max, etc. for `similarityScore` fields. Flattened here denotes the fact
that all annotated entities are treated as a flat list - no per document
analysis is performed.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/nested.html
