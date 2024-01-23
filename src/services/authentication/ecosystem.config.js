module.exports = {
	"apps" : [
		{
			"name" : "authentication",
			"script" : "src/services/authentication/service/app.mjs",
			"watch" : true,
			"env" : {
				"NODE_ENV": "dev"
			}
		}
	]
}
