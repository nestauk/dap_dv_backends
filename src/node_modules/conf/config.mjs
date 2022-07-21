export const arxliveCopy =
	'search-datavis-arxlive-copy-n6ltva3lqh7x7xb6ucpaqfb5a4.eu-west-2.es.amazonaws.com';
export const ec2 = 'http://ec2-3-8-167-48.eu-west-2.compute.amazonaws.com';
export const spotlightEndpoint = `${ec2}:2222/rest/annotate`;
export const confidenceValues = [
	0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
];
export const confidenceScores = [
	0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
];

export const settings = {
	snapshotSettings: {
		region: 'eu-west-2',
		bucketName: 'nesta-datavis-arxlive-copy-snapshot',
		snapshotRole: 'arxliveSnapshotRole',
		repository: 'spotlight-annotation-backups',
		awsID: '195787726158',
	},
};


