# Architecture

The system consists of 4 persistent machines (EC2 instances) and a variable
number of instances processing annotations that are created and torn down as needed.

This architecture emphasizes modularity, security, and scalability. Deployment involves configuring each EC2 instance with the appropriate security group settings, domain names, and routes as outlined. The system's design allows for automated scaling of annotation processing capabilities, ensuring efficient handling of varying loads.

## Common Assets

### Security Groups

An AWS security group is essential, with the following ports open, which must be assigned to all four static EC2 instances:

- **Name**: `dv-http-https-web-server` (customizable)
- **Ports**:
  - **22**: SSH
  - **80**: HTTP (returns 404, used for CertBot domain validation)
  - **443**: HTTPS

The Spotlight annotator requires distinct firewall settings:

- **Name**: `spotlight-node` (customizable)
- **Ports**:
  - **22**: SSH
  - **80**: HTTP
  - **2222**: Spotlight annotator English port (internal only)
  - **4000**: Annotation mapper port

### Domain

Services are hosted under `dap-tools.uk`. Substitute `BASE_DOMAIN` in `src/services/config.mjs` with your domain if different.

## EC2 Instances

### Reverse Proxy

This machine collects all the APIs' routes in a single domain.

- **EC2 Name**: `dap-services-reverse-proxy` (customizable)
- **Domain**: `api.<BASE_DOMAIN>`
- **Security Group**: `dv-http-https-web-server`
- **Routes**:
  - `/auth/…` -> `authentication.<BASE_DOMAIN>/…`
  - `/annotate/…` -> `annotation.<BASE_DOMAIN>/…`
  - `/spotlight/…` -> `spotlight.<BASE_DOMAIN>/…`

### Authentication Server

This machine takes care of:
- accepting requests for tokens by providing an email
- sending emails with a token and a token activation link
- authenticating requests with valid email/token pairs

- **EC2 Name**: `dv-authentication-server` (customizable)
- **Domain**: `authentication.<BASE_DOMAIN>`
- **Security Group**: `dv-http-https-web-server`
- **Routes**:
  - `/request?email=username@<AUTH_EMAIL_DOMAIN>` (verification email sending)
  - `/provide?email=...&token=...` (token activation)
  - `/authenticate?email=...&token=...` (token validation)

### Annotation Server

This machine:
- receives requests to annotate documents stored in either an S3 file or an ElasticSearch index
- it requests the provision server to create annotation nodes
- it dispatches batches of documents for annotation

- **EC2 Name**: `dbpedia-annotation-master` (customizable)
- **Domain**: `annotation.<BASE_DOMAIN>`
- **Security Group**: `dv-http-https-web-server`
- **Routes**:
  - `/status`
  - `/progress/:id`
  - `/s3`
  - `/es`

### Provision Server

This machine:
- creates and destroys annotation nodes
- acts as load-balancing proxy for requests to the annotation nodes

- **EC2 Name**: `spotlight-master` (customizable)
- **Domain**: `spotlight.<BASE_DOMAIN>`
- **Security Group**: `dv-http-https-web-server`
- **Routes**:
  - `/annotate` (load balancing through Nginx)
  - `/provision`
  - `/teardown`
  - `/state`
  - `/status`

#### Annotation Nodes

These machines:
- receive a batch of documents
- run Spotlight on a specific field for each document
- store the annotations on the corresponding document in the ElasticSearch index

- **Domain**: Uses dynamically assigned IPs
- **AMI**: `spotlight-node-v.0.1` / `ami-06cb614d0f047d106`
- **Security Group**: `spotlight-node`

### Elasticsearch Domain and Indices

- **Domain URI**: `dap-annotation-service`
- **Index URI**: `ai_map`

### S3 Bucket (Optional)

- **Domain URI**: `dap-uk-ai-map.public`
