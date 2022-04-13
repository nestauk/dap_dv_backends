## Histogram of Max `confidence`

Produces a histogram of the max `confidence` per document, i.e. finds each
documents entity with the highest `confidence` value then bins using an interval
of 0.1. Uses a script to calculate the highest confidence per doc. In
particular, it uses the `params._source` field, which is what enables us to use
the painless scripting language on the underlying data (the initial json data
that was sent as part of the PUT request). As a result, this query is quite
slow.

Endpoint: `arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/modules-scripting.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/modules-scripting-painless.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/modules-scripting-fields.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/mapping-source-field.html