## Duplicate Aggregations

These aggregations include a mixture of different descriptive statistics
relating to metadata which describes the duplicates found for entities provided
by the Spotlight Tool. In particular, `dupes_10` and `dupes_60` are measures of
how many duplicates were found **at that confidence level**. So if
`dupes_10_count`'s value is 6, then there were a total of 6 duplicates found at
confidence level 10. One entity having duplicates counts as a single occurrence
of a duplicate, e.g. if `Photon` has 3 duplicates found at confidence level 10,
it will contribute 1 occurrence to the total `dupes_10_count`.

We also provide aggregations on the `dupes_ratio_X` metadata value, which is
simply the `dupes_count_X` value divided by the total number of entities
annotated for that piece of text.

The aggregations use both `extended_stats` and `histogram`s for each metadata
value (`dupes_count_X` and `dupes_ratio_X`)

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-histogram-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-metrics-extendedstats-aggregation.html