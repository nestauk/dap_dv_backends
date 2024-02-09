<!-- FIXME rewrite -->

# Server provisioning annotation servers

A server which provides endpoints for annotation. It uses Terraform to provision
resources which then get load balanced using nginx to allow for flexible usage
of compute resources. For larger workloads, more workers can be provisioned
which ensures the compute bottleneck for the annotation process is minimised.

The following endpoints are exposed:

- `POST /create`

    takes requests with the following request body:
    ```json
    {
        "workers": n
    }
    ```
    where n is th enumber of EC2 instances you wish to provision.

    Note that you can send this request multiple times, and the server will
    reupdate the number of instances. If you increase the workers from what is
    currently provisioned, it will simply add the difference. The same if the
    `workers` argument is lower than the current number of instances - it
    destroys the difference supplied.

- `POST /teardown`

    Removes all EC2 instances previously provisioned.

- `POST /annotate`

    Forwards the request to the Spotlight annotation services created using
    `/create`. Takes the same paramaters as documented on the [Spotlight
    API.](https://www.dbpedia-spotlight.org/api)

## Documentation

The server uses a combination of Terraform for resource provisioning, AWS AMI
types to ensure that the created EC2 instances have docker and other software
installed, NGinx for load balancing between the instances, and expressJS for
a very simple REST API exposing the server's functionality.
