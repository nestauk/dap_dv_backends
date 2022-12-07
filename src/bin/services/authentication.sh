#! /bin/bash

path="src/services/authentication/service/app.mjs"
if [[ $NODE_ENV == "dev" ]]; then
    node $path
else
    nodemon $path
fi