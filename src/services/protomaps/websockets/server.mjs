import express from 'express';
import expressws from 'express-ws';
import * as _ from 'lamb';

const app = express();
const expressWs = expressws(app);

app.use(function (req, res, next) {
	console.log('middleware');
	req.testing = 'testing';
	return next();
});

app.get('/', function(req, res, next) {
	console.log('get route', req.testing);
	res.end();
});

app.ws('/', function(ws, req) {
	ws.on('message', function(msg) {
		const ids = JSON.parse(msg);
		const min = Math.min(...ids);
		const max = Math.max(...ids);
		const scale = _.map(
			ids,
			id => (id - min) / (max - min)
		);
		ws.send(JSON.stringify(scale));
	});
	console.log('socket', req.testing);
});

app.listen(3000);
