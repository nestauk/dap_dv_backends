export const parseS3URI = uri => {
	const url = new URL(uri);
	return {
		bucket: url.host,
		key: url.pathname.slice(1)
	};
};

export const buildS3Uri = (bucket, key) => {
	return `s3://${bucket}/${key}`;
};

export const uriToEsIndex = uri => {
	const { bucket, key } = parseS3URI(uri);
	return `${bucket}.${key.replaceAll('/', '.')}`;
};
