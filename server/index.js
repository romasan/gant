const http = require('http');
require("dotenv").config();
const { start } = require('./api/start');
const { issue } = require('./api/issue');
const { issues } = require('./api/issues');

const {
	WEB_SERVER_HOST,
	WEB_SERVER_PORT,
} = process.env;

const routes = {
	'/start': start,
	'/issue': issue,
	'/issues': issues,
};

const callback = async (req, res) => {
	const reqUrl = req.url.split('?').shift();

	console.log('==== url:', reqUrl);

	res.setHeader('Access-Control-Allow-Origin', req?.headers?.['origin'] || '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// if (req?.url === '/report') {
	// 	res.setHeader('Content-Type', 'application/json');
	// 	res.end(JSON.stringify({
	// 		total: IDs.length,
	// 		data: getReportFile(),
	// 	}));

	// 	return;
	// }

	if (routes[reqUrl] && req.method !== 'OPTIONS') {
		routes[reqUrl](req, res);

		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.end('{"debug": "=)"}');
};

const webServer = http.createServer(callback);

console.log('Start web server', new Date().toGMTString(), 'on', WEB_SERVER_HOST, WEB_SERVER_PORT);

webServer.listen(WEB_SERVER_PORT, WEB_SERVER_HOST);
