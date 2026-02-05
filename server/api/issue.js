const { v4: uuid } = require('uuid');
const { getSearch } = require('../utils');
const { getIssue } = require('../jira');
const { getPostPayload } = require('../utils');

const { get, set } = require('../db');

const issue = async (req, res) => {
	if (req.method === 'POST') {
		const postPayload = await getPostPayload(req, 'json');
		const allIssues = get('issues');
		const prevIssueIndex = allIssues.findIndex(
			(item) =>
				(item?.jira?.key && (item?.jira?.key === postPayload?.jira?.key)) ||
				(item?.key && (item?.key === postPayload.key))
		);
		let payload = {};

		if (prevIssueIndex >= 0) {
			const prevIssue = allIssues[prevIssueIndex];

			prevIssue.jira = postPayload.jira;
			prevIssue.base = postPayload.base;

			if (!prevIssue.id) {
				prevIssue.id = uuid();
			}

			payload = { updated: true };

		} else {
			allIssues.push({
				...postPayload,
				key: uuid(),
			});

			payload = { created: true };
		}

		set('issues', allIssues);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(payload));

		return;
	}

	if (req.method === 'DELETE') {
		const search = getSearch(req);
		const allIssues = get('issues');

		let nextIssues = allIssues.filter((item) => item?.key !== search?.query);

		set('issues', nextIssues);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));

		return;
	}

	const search = getSearch(req);
	const data = await getIssue(search.query);

	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(data));
};

module.exports = {
	issue,
};
