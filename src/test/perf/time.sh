#! /bin/bash

# Creates a test index named after the ip of the machine running the annotation.
# Assumes there is already a docker container running on the instance/machine.

if [ ! `which docker` ]; then
  echo "No version of docker executable found. Please install before running this script"
  exit 1
fi

# At least one docker container should be running
if ! [ "$( docker container inspect -f '{{.State.Running}}' "spotlight_5" )" == "true" ]; then 
  echo "Please ensure at least one spotlight container is running, using the
  script found at src/bin/spotlight/setup.sh"
  exit 1
fi

hostname=`cat /etc/hostname`
index=${hostname//-/_}

node src/bin/es/index.mjs delete $index
sleep 1 

node src/bin/es/index.mjs create $index \
  --path src/test/conf/test_index_mapping.json 
sleep 1 

node src/bin/es/index.mjs reindex arxiv_v6 $index \
  --ignore dbpedia_entities dbpedia_entities_metadata \
  --max-docs 100000 \

before=`date +%s`

export NODE_ENV=production 
export NODE_NO_WARNINGS=1 

node src/bin/es/annotate.mjs \
  --field textBody_abstract_article \
  --name dbpedia_entities \
  --index $index \
  --spotlight http://localhost:2220/rest/annotate \
  --batch-size 100 \
  --page-size 1000 \
  --include-metadata

after=`date +%s`

echo "Time taken:"
echo $(( $after - $before ))