# syntax=docker/dockerfile:1
# Build from the root directory of the repository:
# sudo docker compose -f src/services/authentication/docker-compose.yml build
FROM node:19
WORKDIR /dap_dv_backends
COPY . . 
RUN npm install
CMD ["npm", "run", "auth"]
