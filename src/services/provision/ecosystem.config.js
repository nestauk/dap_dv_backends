module.exports = {
	"apps" : [
		{
			"name" : "provision",
			"script" : "src/services/provision/service/app.mjs",
			"watch" : true,
			"env" : {
				"NODE_ENV": "dev"
			}
		}
	]
}
