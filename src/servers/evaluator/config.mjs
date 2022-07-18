/* indices */

export const mainIndex = 'ai_map';
export const devIndex = 'ai_map_evaluations_dev';
export const stagingIndex = 'ai_map_evaluations_staging';

// not created yet
export const productionIndex = 'ai_map_evaluations_production';

export let evaluationIndex;


// eslint-disable-next-line no-process-env
switch (process.env.NODE_ENV) {
	case 'dev':
		evaluationIndex = devIndex;
		break;
	case 'staging':
		evaluationIndex = stagingIndex;
		break;
	case 'release':
		evaluationIndex = productionIndex;
		break;
	default:
		evaluationIndex = devIndex;
		break;
}

/* server */

export const serverPort = 4000;

/* filtering */

export const confidenceThreshold = 60;
