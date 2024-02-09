module.exports = {
	apps: [
		{
			name: 'annotation',
			script: 'src/services/annotation/service/app.mjs',
			watch: true,
			env: {
				NODE_ENV: 'dev'
			}
		}
	]
}
