module.exports = {
	apps: [
		{
			name: 'provision',
			script: 'src/services/provision/service/app.mjs',
			watch: true,
			ignore_watch: ['src/services/provision/terraform'],
			env: {
				NODE_ENV: 'dev'
			}
		}
	]
}
