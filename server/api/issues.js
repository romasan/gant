const { updateIssues } = require('../jira');
const { set } = require('../db');

const issues = async (req, res) => {
    if (req.method === 'DELETE') {

        set('issues', []);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));

        return;
    }

    await updateIssues();

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
};

module.exports = {
	issues,
};
