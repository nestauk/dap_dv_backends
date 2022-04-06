This snapshot contains the new state of the domain, where the
`original-arxiv_v6` has been deleted. It also contains `arxiv_v6`, which is
annotated, but which does _not_ have the `token_count` analyser for the
`textBody_article_abstract` field.

See https://github.com/nestauk/dap_dv_backends/issues/21 for reasoning, and
https://github.com/nestauk/dap_dv_backends/pull/22 for changes introduced.
