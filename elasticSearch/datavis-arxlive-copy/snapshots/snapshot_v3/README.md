This snapshot contains a version of arxiv_v6 that tokenises the
`textBody_abstract_field` upon ingestion. This was performed so as to use the
length of tokens when performing data quality aggregations. Specifically, we
want to be able to normalise the number of high confidence entities annotated by
the number of tokens, to get an idea of how many of these entities are being
annotated compared to how many words are present in the abstract.

The following has been added to the mapping for the `textBody_abstract_field`:

```json
"tokens": {
    "type": "token_count",
    "analyzer": "standard"
}
```

The mapping now looks like:

```json
"textBody_abstract_article": {
    "type": "text",
    "fields": {
        "keyword": {
            "type": "keyword"
        },
        "tokens": {
            "type": "token_count",
            "analyzer": "standard"
        }
    }
}
```
