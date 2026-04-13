const { get } = require('../db');
require('dotenv').config();

const { JIRA_URL } = process.env;

const start = (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({
		host: JIRA_URL,
		...get(),
	}));
};

module.exports = {
	start,
};
