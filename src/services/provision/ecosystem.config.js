module.exports = {
	"apps" : [
		{
			"name" : "spotlight",
			"script" : "src/services/spotlight/service/app.mjs",
			"watch" : true,
			"env" : {
				"NODE_ENV": "dev"
			}
		}
	]
}
