# Setup

To get this server to work locally, do the following:

- Install Node.js and npm (tested with Node.js `v18.4.0` and npm `8.12.1`)
- Install Redis and ensure the service is running and exposed on its default port `6379` (tested with Redis `7.0.2)
- Set NODE_ENV to one of the following: `dev`, `staging`, `release`
- Run the server using `npm run evaluationServer`

If you want the app to run on a remote server and you wish to forward HTTP
traffic, install nginx on the server and either copy the `nginx.conf` contents
to /etc/nginx/nginx.conf or symlink the conf file to the one found in this repo:
`sudo ln -sf /path/to/repo/src/servers/evaluator/nginx.conf /etc/nginx/nginx.conf`

Then reload the server: `sudo nginx -s reload` 

The current frontend is deployed using Netlify, in which case secure access is
needed to the endpoints. In this case, we use `certbot` to aquire a free SSL
cert authorised by `letsencrypt` - this will require a domain purchase and some
modifications to the nginx.conf file to set up. More documentation can be found
[here](https://certbot.eff.org/).

You'll most likely have to change the ElasticSearch indices if you don't have
access to the Nesta defaults.

# Current Servers

- `dev`: dev.ai-map.dv.dap-tools.uk
- `staging`: staging.ai-map.dv.dap-tools.uk

A release server will also be provisioned when we finish testing the service.
# AWS 

Use AMI `spotlight-evaluator-backend` (id: `ami-0f140f131ee80beff`) if you
wish to quickly create new instances with the neccessary packages/software
installed.

Use Security Group `spotlight-evaluator` (id: `sg-012d3b94477f1b162`) as 
security group.