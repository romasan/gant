const { get } = require('../db');

const start = (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(get()));
};

module.exports = {
	start,
};
