## Documents missing the `dbpedia_entities` Field

This query uses a combination of the nested, bool, must_not and exists API
parameters to determine which documents are missing the `dbpedia_entities`
field.

Endpoint: `POST arxiv_v6/_count`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/nested.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl-exists-query.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl-bool-query.html

### Notes

We are using the query API because we can't use the `missing` Aggregation API as
it does not support `nested` type fields.

See:

- https://github.com/elastic/elasticsearch/issues/9571