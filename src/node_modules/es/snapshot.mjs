import { settings as globalSettings } from 'conf/config.mjs';
import { buildRequest, makeRequest } from 'es/requests.mjs';

const settings = globalSettings.snapshotSettings;

/**
 * @function register
 * @description Registers a snapshot repository on the specified domain. This
 * repository is essentially a directory to contain snapshots, and
 * a default one for ES snapshots is typically created when the
 * user has specified the correct AWS configurations.
 * @param {string} domain - domain on which to register snapshot.
 * @param {string} repository - name of repository to register.
 * @returns {Object} reponse of request.
 */
export const register = (domain, repository) => {
	const path = `_snapshot/${repository}`;
	const payload = {
		type: 's3',
		settings: {
			bucket: settings.bucketName,
			region: settings.region,
			role_arn: `arn:aws:iam::${settings.awsID}:role/${settings.snapshotRole}`,
		},
	};
	const request = buildRequest(domain, path, 'PUT', { payload });
	return makeRequest(request, { verbose: true });
};

/**
 * @function trigger
 * @description this function triggers a snapshot for the specified domain and
 * saves it in the repository with the given snapshot name.
 * @param {string} domain - domain on which to trigger the snapshot.
 * @param {string} repository - repository in which to save the snapshot result.
 * @param {string} snapshot - name of the snapshot.
 * @returns {Object} response of request.
 */
export const trigger = (domain, repository, snapshot) => {
	const path = `_snapshot/${repository}/${snapshot}`;
	const request = buildRequest(domain, path, 'PUT');
	makeRequest(request, { verbose: true });
};

/**
 * @function list
 * @description lists the snapshots for the specified domain and repository.
 * @param {string} domain - domain on which to list the snapshots.
 * @param {string} repository - repository in which to list the snapshots.
 * @returns {Object} response object, containng the list of snapshots.
 */
export const list = (domain, repository) => {
	const path = repository ? `_snapshot/${repository}/_all` : '_snapshot';
	const request = buildRequest(domain, path, 'GET');
	return makeRequest(request, { verbose: true });
};

/**
 * @function restore
 * @description restores the domain to the specified snapshot located in the
 * specified repository.
 * @param {string} domain domain on which to restore.
 * @param {string} repository - repository from which to get the snapshot needed to restore.
 * @param {string} snapshot - name of snapshot used to restore.
 * @returns {Object} response of request.
 */
export const restore = (domain, repository, snapshot) => {
	const payload = { indices: '-.kibana*,-.opendistro*' };
	const path = `_snapshot/${repository}/${snapshot}/_restore`;
	const request = buildRequest(domain, path, 'POST', { payload });
	return makeRequest(request, { verbose: true });
};

/**
 * @function status
 * @description retrieves snapshot status of specified domain.
 * @param {string} domain - domain on which to retrieve status.
 * @returns response object containing snapshot status of specified domain.
 */
export const status = domain => {
	const path = '_snapshot/_status';
	const request = buildRequest(domain, path, 'GET');
	return makeRequest(request, { verbose: true });
};
