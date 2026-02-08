const { getPostPayload } = require('../utils');

const { get, set } = require('../db');

const listJql = async (req, res) => {
	if (req.method === 'POST') {
		const { key, values } = await getPostPayload(req, 'json');

		const jqlValues = get('jql');

		jqlValues[key] = values;

		set('jql', jqlValues);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));

		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({}));
};

module.exports = {
	listJql,
};
