# Logstash Ingestion Pipeline

## How to run

**N.B:** the following assumes you are running the ingestion on Ubuntu 22.04. If
this is not the case, please install the relevant OpenSearch Logstash 
version for your system.

Download the JDBC driver

`wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-j-8.0.31.tar.gz`

Untar

`tar -xvf /<path_to_jdbc_tarball>`

Install the `OpenSearch` version of `Logstash` (needed for AWS managed ES domains)

(Check before that the link below is the latest version [here](https://opensearch.org/downloads.html))

`wget https://artifacts.opensearch.org/logstash/logstash-oss-with-opensearch-output-plugin-8.4.0-linux-x64.tar.gz`

Untar

`tar -xvf <path_to_logstash_tarball> -C <directory>`

Set environment variables

```sh
# mysql connector, tested and working with mysql-connector-j-8.0.31.jar
export JDBC_DRIVER_PATH=<path_to_driver_directory>/mysql-connector-<version>.jar
# username and password for mysql db connection
export JDBC_USER=<mysql_username>
export JDBC_PASSWORD=<mysql_db_password>
# aws access, for access to the hosted ElasticSearch index/domain
export AWS_ACCESS_ID=<aws_access_key_id>
export AWS_ACCESS_KEY=<aws_secret_access_key>
# name of connection string to the hosted db
# this must contain the path to the db itself
export JDBC_CONNECTION_STRING=jdbc:<connection_string>:<port>/<database>
# name of table to ingest
export LOGSTASH_INPUT_TABLE=<your_table_name>
# name of ElasticSearch domain and index to write data to
export LOGSTASH_OUTPUT_DOMAIN=<domain> 
export LOGSTASH_OUTPUT_INDEX=<index>
```

It's usually easier to copy these commands to a configuration file, set the
appropriate values, then `source pipeline.rc` or equivalent to quickly load in the
environment variables.

Change to `Logstash` directory

`cd /<path>/logstash-<version>`

**N.B**: The pipeline expects an auto-increment column named `id` in order to be
able to run, please ensure this exists on the input MySQL table before running
the pipeline.

Run executable pointing to the pipeline config in this directory

`bin/logstash -f /<path_to_repo>/data/hpmt/pipeline.conf`

### Troubleshooting

If the pipeline runs OK but you get a message like

`The driver has not received any packets from the server.`

Make sure the instance you're running this pipeline from has permissions to
access the DB, e.g. that the IP is listed in the allowed incoming requests in
the EC2/RDS security configuration.
