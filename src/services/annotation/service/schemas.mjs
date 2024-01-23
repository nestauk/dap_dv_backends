import { arxliveCopy as DEFAULT_DOMAIN } from 'dap_dv_backends_utils/conf/config.mjs';

const uuidv4Regex =
	'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

const progressSchema = {
	type: 'object',
	properties: {
		total: { type: 'number' },
		email: { type: 'string' },
		id: { type: 'string' },
		current: { type: 'number' },
		startTime: { type: 'number' },
		endTime: { type: 'number' },
		index: { type: 'string' },
		domain: { type: 'string' },
		bucket: { type: 'string' },
		key: { type: 'string' },
	},
};

const event = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		workers: { type: 'number' },
		domain: { type: 'string' },
		index: { type: 'string' },
		field: { type: 'string' },
		newField: { type: 'string' },
		annotationEndpoint: { type: 'string' },
		type: { type: 'string' },
		includeMetaData: { type: 'boolean' },
		progress: progressSchema,
	},
};

/* GET /status */
export const getStatusSchema = {
	summary: 'Get current status of Annotation server',
	description:
		'Returns the status of the current Annotation server. Includes information on provisioned EC2 instances for ongoing annotations. Also includes information about past annotations, and the progess of ongoing annotations.',
	response: {
		'2xx': {
			type: 'object',
			properties: {
				XstateContext: {
					type: 'object',
					properties: {
						waiting: { type: 'array', items: event },
						provisioning: { type: 'array', items: event },
						annotating: { type: 'array', items: event },
						finished: { type: 'array', items: event },
						currentWorkers: { type: 'number' },
						desiredWorkers: { type: 'number' },
					},
				},
				progress: {
					type: 'object',
					patternProperties: {
						[uuidv4Regex]: progressSchema,
					},
				},
			},
		},
	},
};

/* GET /progress/:id */
export const getProgressSchema = {
	summary: 'Get progress for a given annotation using its ID',
	description:
		'Using the ID provided by the response to an annotation request, you can use this endpoint to retrieve information about the progress of the annotation. When the annotation has finished, you should also recieve an email notifying you of the fact.',
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'string',
				description: "ID provided by the annotation request's response",
			},
		},
	},
	response: {
		200: {
			type: 'object',
			properties: {
				status: { type: 'string', enum: ['down', 'provisioning', 'up'] },
				progress: { type: 'number' },
				total: { type: 'number' },
				timeTakenInMs: { type: 'number' },
			},
		},
		404: {
			type: 'object',
			properties: {
				error: { type: 'string' },
			},
		},
	},
};

const annotationBody = {
	includeMetaData: {
		type: 'boolean',
		default: true,
		description:
			'Whether to include metadata about the annotation process along with annotation results',
	},
	newField: {
		type: 'string',
		default: 'dbpedia_entities',
		description:
			'Name of key corresponding to newly created annotation field',
	},
	workers: {
		type: 'number',
		default: 4,
		description:
			'Number of EC2 instances created to handle annotation process',
	}
};
const annotationResponse = {
	'2xx': {
		type: 'object',
		properties: {
			id: { type: 'string' },
		},
	},
};

/* POST /annotate/s3 */
export const postAnnotateS3Schema = {
	summary: 'Annotate data being hosted on an AWS S3 bucket',
	description:
		'The endpoint expects an input S3 URI and output S3 URI. The dataset to be annotated must adhere to a required schema, which is documented below.\n\nThe input dataset must be in `json` format, with the root level object being an array. Each item in the array must be an object, with an optional id field, and the `field` key that you speficy in the request body. For example, the following is a dataset which conforms to the correct input schema:\n\n<pre><code>[\n\t{ "id": 1, "description": "This is some test data to be annotated." },\n\t{ "id": 2, "description": "This is some more test date to be annotated." }\n]</code></pre>\n\nThe API will perform a number of checks to ensure that the data is available and that the dataset and request is well formed. However, please ensure that the input S3 URI exists, and that the output S3 URI does *not* exist, as the service will not overwrite any existing data on S3.',

	security: [
		{ 'basicAuth': [] }
	],
	query: {
		type: 'object',
		required: ['field', 's3_input_uri', 's3_output_uri'],
		properties: {
			field: {
				type: 'string',
				description: 'Field for the value being annotated.'
			},
			s3_input_uri: {
				type: 'string',
				description: 'URI for bucket containing input dataset',
			},
			s3_output_uri: {
				type: 'string',
				description:
					'URI for output bucket. Please ensure this bucket does not already exist',
			},
			idField: {
				type: 'string',
				description: 'Field corresponding to ids for the documents being annotated. If null, these IDs will be generated using the ElasticSearch API.',
				default: null
			},
			output_format: {
				type: 'string',
				enum: ['array', 'object', 'entities'],
				description: 'Output type, whether the root data type should be an aray or an object',
				default: 'array'
			},
			output_processor: {
				type: 'string',
				enum: ['default', 'es', 'simple'],
				description: 'Final type of output. Different types are described in detail in the docs.',
				default: 'default'
			},
			...annotationBody,
		},
		examples: [
			{
				summary: "test",
				value: {
					field: 'description',
					email: 'user@nesta.org.uk',
					s3_input_uri: 's3://<bucket>/path/to/data.json',
					s3_output_uri: 's3://<bucket>/path/to/output.json',
					includeMetaData: true,
					newField: 'dbpedia_entities',
					workers: 4,
				}
			},
		],
	},
	response: annotationResponse,
};

/* POST /annotate/es */
export const postAnnotateEsSchema = {
	summary: 'Annotate data being hosted on an ElasticSearch index',
	description:
		'This endpoint expects to be able to access the specified ES index and domain. Users should also specify the field contained within the ES doc to be tused as input for the annotation process.',
	security: [
		{ 'basicAuth': [] }
	],
	query: {
		type: 'object',
		required: ['index', 'field'],
		properties: {
			field: {
				type: 'string',
				description: 'Field for the value being annotated.'
			},
			index: {
				type: 'string',
				description:
					'Index on which the text to be annotated is hosted',
			},
			domain: {
				type: 'string',
				default: DEFAULT_DOMAIN,
				description:
					'ElasticSearch domain on which the index is hosted',
			},
			...annotationBody,
		},
	},
	response: annotationResponse,
};
