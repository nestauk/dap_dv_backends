# Simple Email Authentication service

Authenticates Nesta users by sending them an email with their token and a 
verification link. Will only send emails to Nesta domains i.e. emails ending
with `@nesta.org.uk`.

To request a token, send a POST request to

`https://authentication.dap-tools.uk/request`

with the following JSON body:
```json
{
    "email": "Your Email"
}
```

This will send a verification email to your Nesta email account. Click the link,
and the token should work. To check if the token does in fact, send a POST
request to

`https://authentication.dap-tools.uk/authenticate`

with the following JSON body:
```json
{
    "email": "Your Email",
    "token": "Your token"
}

You should get a response of `true`.