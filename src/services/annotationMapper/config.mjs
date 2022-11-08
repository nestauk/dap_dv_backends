export const PORT = 4000;

// the odd looking domain 'worker' is created when launching docker containers.
// see /src/services/spotlight/spotlightDockerCommand.sh
export const DOCKER_SPOTLIGHT_ENDPOINT = 'http://worker:2222/rest/annotate';
