# Simple Email Authentication service

Authenticates Nesta users by sending them an email with their token and a 
verification link. Will only send emails to Nesta domains i.e. emails ending
with `@nesta.org.uk`.

To request a token, send a POST request to

`https://api.dap-tools.uk/auth/request`

with the following JSON body:
```json
{
    "email": "Your Email"
}
```

This will send a verification email to your Nesta email account. Click the link,
and the token should work. To check if the token does in fact, send a POST
request to

`https://api.dap-tools.uk/auth/authenticate`

with the following JSON body:
```json
{
    "email": "Your Email",
    "token": "Your token"
}
```
You should get a response of `true`.


You can also use the Swagger UI to make these requests. To access the UI,
simply navigate to `https://api.dap-tools.uk/auth`. 

## Docker

To run as docker containers, first ensure that you add your AWS credentials
to an enviromnent file at the following path: `src/services/authentication/.env`.

Here's an example:

```bash
# The following three variables are required
AWS_ACCESS_KEY_ID=<YOUR ID KEY>
AWS_SECRET_ACCESS_KEY=<YOUR ACCESS KEY>
AWS_DEFAULT_REGION=eu-west-2

# Optional, default is 4000
PORT=4000
```

Then run the following from the root level of this repository:

`docker compose -f src/services/authentication/docker-compose.yml up`