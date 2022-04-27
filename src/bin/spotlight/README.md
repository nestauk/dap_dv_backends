## Nginx Load Balancer for Spotlight Containers
### Prerequisites

You will need sudo priveleges and an installation of `nginx` for the script to
work.

### Running the script

To setup the approrpriate docker/container setup, use the
src/bin/spotlight/setup.sh script with the number of containers as the only
input paramater. Be careful in choosing the correct number of containers, as
depending on how much memory is available, you can overload the system's
resources. 

Generally, the English spotlight language model needs 2GB of memory, so each new
container will require 2GB more of memory. In practice, there is slightly more
overhead related to each, so if your instance has 8GB of memory, it's safer to
spin up 3 containers. Please refer to the spotlight docker container
documentation [here](https://hub.docker.com/r/dbpedia/dbpedia-spotlight) for
other language model's memory requirements.

All requests to the Spotlight service at port 2200 will now be load balanced
between the number of containers you have specified.