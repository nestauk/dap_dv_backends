# Simple Email Authentication service

Authenticates users by sending them an email with their token and a 
verification link. Will only send emails to emails ending
with `@<AUTH_EMAIL_DOMAIN>`.

To request a token, send a POST request to

`https://api.dap-tools.uk/auth/request`

with the following JSON body:
```json
{
    "email": "Your Email"
}
```

This will send a verification email to a valid email account ending in <AUTH_EMAIL_DOMAIN>. Click the link,
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
