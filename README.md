# dap_dv_backends Repository

## Overview

This system is designed to annotate text from documents using DbPedia Spotlight from Wikipedia in such a way that annotations (topics) are Wikipedia pages.

It does so by creating an infrastructure of EC2 instances to annotate batches of documents stored in either S3 or ElasticSearch, orchestrating the flow of information automatically. You'll find a more thorough description of the architecture in [docs/architecture.md.md](docs/architecture.md.md).

## Requirements

This system relies on having an ElasticSearch index. There are two scenarios:
- The data is in this index: In this case the index acts as a source and recipient of the annotations.
- The data is in S3: In this case the ElasticSearch index acts as a recipient of the annotations.

Using a tool (e.g. `Insomnia`) select your domain URI pointing to the ES index domain (e.g. in our case https://es.annotations.dap-tools.uk/).

Then create the index:

```
PUT /my-index
```

Use that index name for data ingestion and annotation tasks.

## Installations

Please refer to [docs/installation.md](docs/installation.md).

## Usage

To annotate data, clients send requests to the reverse proxy, which then routes these to the appropriate service based on the request path. This setup simplifies access control, monitoring, and management of the system's components.

The process is in 3 steps:

- Make sure you have AWS credentials in `~/.aws`
- Navigate to the `dap_dv_backends` repo, then:
	- edit `src/services/config.mjs`
	- push the changes to the repo
	- `npm install` if needed
	- `npm run deployInfra`
- To request a token, in your browser:
	- navigate to `https://<API_SUBDOMAIN>.<BASE_DOMAIN>/static/index.html` (for Nesta this would be `https://api.dap-tools.uk/auth/static/index.html`)
	- open the `/request` section
	- click on `Try it out`
	- insert your email, click on `Execute`: this should send you an email
- Check your email for an email with the token then:
	- copy the token
	- click on the activation link
- In your terminal:
	- `export set NESTA_EMAIL=<email>`
	- `export set NESTA_TOKEN=<token>`
- Navigate to the `nestauk/dsp_waifinder` repo, then:
	- `cd etl`
	- `npm install`
	- `npm install dap_dv_backends_utils` (this installs from a git url so make sure you have the latest version, `0.0.16`)
	- edit the npm script to point to the domains you have chosen, so for example
	in [1] check make sure the `-e` is correct
	- `npm run annotateData`
- When the annotation has finished:
	- you should receive an email to notify you the annotation is done
	- navigate to your local `dap_dv_backends` repo
	- `npm run deleteInfra`


[1] `"annotateData": "npx annotateEsIndex -d es.annotations.dap-tools.uk -e https://api.dap-tools.uk/annotation -i ai_map -f description"`
