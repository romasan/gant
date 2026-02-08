const { updateIssues, refetchIssue } = require('../jira');
const { get, set } = require('../db');
const { getPostPayload } = require('../utils');

const issues = async (req, res) => {
	if (req.method === 'PATCH') {
		const postPayload = await getPostPayload(req, 'json');

		for (const key of postPayload.keys) {
			await refetchIssue(key);
		}

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));

		return;
	}

	if (req.method === 'DELETE') {
		const postPayload = await getPostPayload(req, 'json');

		if (postPayload?.keys) {
			const issues = get('issues');

			set('issues', issues.filter((issue) => !issue?.jira?.key || !postPayload.keys.includes(issue.jira.key)));

			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({ deleted: postPayload?.keys?.length }));

			return;	
		}

		const count = get('issues')?.length;

		set('issues', []);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ deleted: count }));

		return;
	}

	const payload = await updateIssues();

	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(payload));
};

module.exports = {
	issues,
};
