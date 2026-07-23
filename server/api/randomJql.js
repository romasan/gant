const { getPostPayload } = require('../utils');

const { getRandomJql } = require('../jira');

const randomJql = async (req, res) => {
	if (req.method === 'POST') {
		const { query } = await getPostPayload(req, 'json');

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(await getRandomJql(query)));

		return;
	}

	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ error: "Нужен метод POST" }));
};

module.exports = {
	randomJql,
};
