# Annotation Service
The annotation service is a REST API which facilitates the use of the [DBpedia
Spotlight](https://www.dbpedia-spotlight.org/) tool on large datasets.

## Authentication
To get started, you must first obtain an API authentication token. This process
is fully explained
[here](https://github.com/nestauk/dap_dv_backends/tree/dev/src/services/authentication).
The REST API docs for the authentication service can be found
[here](https://api.dap-tools.co.uk/auth).

Once you have a token for your associated Nesta Email, you're ready to use the
annotation service.

The annotation endpoints `/annotation/s3` and `/annotation/es` are protected using
Basic authorization, so you must set an Authorization header with the following
format when making requests to these endpoints: 

`Authorization Basic <credentials>`. 

Credentials are constructed by combining your Nesta email and your API token
with a colon (email:token), and then by encoding the resulting string in base64.
For example, with email `user@nesta.org.uk` and token `abc123`, you would encode
the string `user@nesta.org.uk:abc123` in base64 to get
`dXNlckBuZXN0YS5vcmcudWs6YWJjMTIz`. 

Your Authorization header would therefore look like 

`Authorization Basic dXNlckBuZXN0YS5vcmcudWs6YWJjMTIz`.

The [Annotation API docs](https://api.dap-tools.uk/annotation) makes this process
much easier, because you can simply enter your login details into the little
lock symbol on the top right hand corner, and it will take care of encoding the
Authorization headers for you.

# Annotation
Please refer to the [Annotation API docs](https://api.dap-tools.uk/annotation) for
much more detailed documentation on the endpoints, including which fields are
required, what each field type is, a description of all of the endpoints,
request bodies, response types, and more. This README.md will attempt to be a
general guide for first time users, as well as cover some of the broader
implications of input and output formats when using the annotation service.

## S3 Annotation
### `https://api.dap-tools.co.uk/annotation/s3`
This endpoint allows you to annotate S3 buckets containing textual data. The
main process involves specifying the URI of an input bucket and an output URI,
and the annotation service will create a new output bucket at the provided URI.
### Input Format
The bucket's contents must be JSON serialised and adhere to a specific format -
mainly that the data at the root level must be an array of objects/dictionaries,
and that each object/dictionary contains an `id` field and a `field` field. The
fields themselves may have different names, which you can specify when making a
request to the endpoint.

The most generic example of input data contained within the bucket looks like
this:

```json
[
    { "id": 1, "description": "This is some test data to be annotated." },
    { "id": 2, "description": "This is some more test date to be annotated." }
]
```

For the example data, you would send a post request with a body that looked like
this:

```json
{
    "s3_input_uri": "s3://location/of/input/bucket.json",
    "s3_output_uri": "s3://desired/location/of/annotated/bucket.json",
    "field": "description",
    "idField": "id"
}
```

Additional key/value pairs in the input S3 bucket are allowed, and will be
included in the output S3 bucket.

If you don't specify an `id`, then `id`s for each field will be automatically
generated for you using the ElasticSearch `CREATE` API. However, if you do
specify `id` field in the POST request, and certain documents don't have that
field, they won't be annotated.

### Output Formats
You can optionally specify the format of the output of the data contained in the
output S3 bucket using the `output_format` and `output_processor` fields.

### `output_format`


One of `['array', 'object', 'entities']`

`array` and `object` control whether your output is an array of documents, or a
dictionary, where the keys are the ids (provided or generated, as documented
above) and the values are the documents provided as input.

`entities` is a special case, where you don't care about any other fields
contained in the inputted document, and you only wan the results of the
annotation. In this case, the keys are the document ids, and the values are the
`dbpedia_entities`, i.e. the annotation results.

### `output_processor` 

One of `['es', 'default', 'simple']`

This determines which keys and values are kept when producing the output. 

The `es` option will output the entire ElasticSearch document, including
metadata about how the document is stored on the index. Useful if you need to do
further work involving ElasticSearch.
 
`default` mirrors the inputs that you have provided, which is to say, the same
document structure as the input, with the annotation results added.

`simple` produces only the annotation results, so your documents will contain
just the `dbpedia_entities` data, i.e. the results of the annotation process.

## ElasticSearch Annotation
### `https://api.dap-tools.co.uk/annotation/es`
If you have data on an ElasticSearch index, then you can also annotate the
documents directly using this endpoint. 

Each document on the index is expected to contain a field to annotate, and the
service will update the index with a new field corresponding to the annotations.
Related parameters are fully documented in the [API
docs](https://api.dap-tools.uk/annotation).

## Progress

### `https://api.dap-tools.co.uk/progress/{id}`

You can use the endpoint above to track the progress of the annotation. Keep in
mind that at the beginning of the process, new compute instances are being
provisioned, so there is a slight delay before the actual annotation begins. 

The endpoint will provide information about how many documents have been
processed, and how many in total will have to be annotated.

You will also receive an email to your Nesta account notifying you of when your
annotation has finished.

### Architecture Diagram

![Annotation Service Architecture Diagram](./Architecture%20Diagram.png)

