## Histogram for `textBody_abstract_article` tokens

Aggregates all `textBody_abstract_article` values into a histogram, each bucket
having an interval of 10 tokens. Tokens are generate upon indexing using
ElasticSearch's standard tokenizer. Also performs an `extended_stats`
aggregation for the `token_count` field.

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/analysis-standard-tokenizer.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html