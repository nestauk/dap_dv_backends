Secrets directory currently use to store local CA certs for developing on a
localhost with https.

To generate your own certs, first install `mkcert`.

On Mac: `brew install mkcert`. 

Others: see https://github.com/FiloSottile/mkcert

Once installed, cd to the root of the repository:

`cd /path/to/dap_dv_backends`

Create the certs directory:

`mkdir src/services/.secrets/certs`

Then:

```bash
mkcert \
-key-file src/services/.secrets/certs/key.pem \
-cert-file src/services/.secrets/certs/cert.pem \
localhost 127.0.0.1
```

These files are linked in the Fastify app configuration, so no further work is
required.