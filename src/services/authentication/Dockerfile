# syntax=docker/dockerfile:1
# Build from the root directory of the repository:
# docker build -t ghcr.io/nestauk/annotation-mapper -f src/services/annotationMapper/Dockerfile .
FROM node
WORKDIR /dap_dv_backends
COPY . . 
RUN npm install
CMD ["node", "src/services/authentication/service/app.mjs"]