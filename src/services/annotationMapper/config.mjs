export const PORT = 4000;

// the odd looking domain 'worker' is created when launching docker containers.
// see /src/services/spotlight/spotlightDockerCommand.sh
export const DOCKER_ANNOTATION_NODE_ENDPOINT = 'http://worker:2222/rest/annotate';
