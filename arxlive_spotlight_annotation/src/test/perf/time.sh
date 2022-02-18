#! /bin/bash

# Creates a test index named after the ip of the machine running the annotation.
# Assumes there is already a docker container running on the instance/machine.

if [ ! `which docker` ]; then
  # get-docker.sh script was taken from https://get.docker.com/,
  # as detailed in the official docs here https://docs.docker.com/engine/install/ubuntu/#install-using-the-convenience-script

  #TODO need to fully test if the following works on EC2 instances. For now just quit
  # sudo sh src/test/perf/get-docker.sh
  
  echo "No version of docker executable found. Please install before running this script"
  exit 1
fi

if [ "$( docker container inspect -f '{{.State.Running}}' dbpedia-spotlight.en )" == "false" ]; then
  sudo docker run -tid --restart unless-stopped \
    --name dbpedia-spotlight.en \
    --mount source=spotlight-model,target=/opt/spotlight \
    -p 2222:80 \
    dbpedia/dbpedia-spotlight spotlight.sh en
fi

hostname=`cat /etc/hostname`
index=${hostname//-/_}

node src/bin/es/index.mjs delete $index
sleep 1 

node src/bin/es/index.mjs create $index \
  --path src/test/conf/test_index_mapping.json 
sleep 1 

node src/bin/es/index.mjs reindex original-arxiv_v6 $index \
  --max-docs 100000 \
  --proceed-on-conflict

before=`date +%s`

npx cross-env NODE_ENV=production NODE_NO_WARNINGS=1 
node src/bin/es/annotate.mjs \
  --field textBody_abstract_article \
  --index $index \
  --spotlight http://localhost:2222/rest/annotate \
  --page-size 1000

after=`date +%s`

echo "Time taken:"
echo $(( $after - $before ))