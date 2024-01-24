<!-- FIXME rewrite -->

# Server provisioning annotation servers

A server which provides endpoints for annotation. It uses Terraform to provision
resources which then get load balanced using nginx to allow for flexible usage
of compute resources. For larger workloads, more workers can be provisioned
which ensures the compute bottleneck for the annotation process is minimised.

The following endpoints are exposed:

- `POST /provision`

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
    `/provision`. Takes the same paramaters as documented on the [Spotlight
    API.](https://www.dbpedia-spotlight.org/api)

## Setup

- Clone the repository and install nodeJS packages.
- Ensure AWS keys are available in the host machine. Usually this will involve
having a directory located at `~/.aws/` with `config` and `credentials` files.
- Run the server using `npm run spotlightServer`.
- Install `nginx` and ensure it's running.
- Symlink the nginx configuration to the one in this repository: `sudo ln -sf
/path/to/repo/src/servers/spotlight/nginx.conf /etc/nginx/nginx.conf`. This will
reverse proxy HTTP requests to the server's port at 3000 as well as configure
the loadbalancer for the instances created using the `/provision` endpoint.

## Configuration

When setting up an EC2 instance, use the `spotlight-master` security group,
found
[here](https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#SecurityGroup:groupId=sg-0a24f96cfe70b3785).

## Documentation

The server uses a combination of Terraform for resource provisioning, AWS AMI
types to ensure that the created EC2 instances have docker and other software
installed, NGinx for load balancing between the instances, and expressJS for
a very simple REST API exposing the server's functionality.
