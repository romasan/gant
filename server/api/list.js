const { getPostPayload } = require('../utils');

const { set } = require('../db');

const list = async (req, res) => {
	if (req.method === 'POST') {
		const { key, values } = await getPostPayload(req, 'json');

		set(key, values);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));

		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({}));
};

module.exports = {
	list,
};
