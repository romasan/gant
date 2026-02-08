const fs = require('fs');
const { v4: uuid } = require('uuid');
const fetch = require('node-fetch');
const { get, set } = require('./db');
require('dotenv').config();

const {
	JIRA_URL,
	JIRA_TOKEN,
} = process.env;

const processIssue = (issue) => {
	const key = issue.key;
	const status = issue.fields.status.name;
	const summary = issue.fields.summary;
	const assignee = issue.fields.assignee.displayName;
	const statuses = issue.changelog.histories.map((item) => {
		const statusField = item.items.find((v) => v.field === 'status');

		if (!statusField) {
			return null;
		}

		return {
			// by: item.author.displayName,
			date: item.created,
			from: statusField.fromString,
			to: statusField.toString,
		};
	}).filter(Boolean);
	const updatedDate = issue.fields.updated;
	const resolvedDate = issue.fields.resolutiondate;
	const createdDate = issue.fields.created;
	const timetracking = issue.fields.timetracking?.originalEstimate;

	return {
		key,
		status,
		summary,
		assignee,
		statuses,
		updatedDate,
		resolvedDate,
		createdDate,
		timetracking,
	};
}

const getIssue = async (issueKey) => {
	// const url = `${JIRA_URL}/rest/api/2/issue/${issueKey}?expand=changelog`;
	const url = `${JIRA_URL}/rest/api/2/issue/${issueKey}?${new URLSearchParams({
		expand: 'changelog',
		fields: 'key,summary,status,assignee,updated,created,sprint,timetracking'
	})}`;

	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${JIRA_TOKEN}`
		}
	});

	const issue = await response.json();
	// const text = await response.text();

	try {
		fs.writeFileSync(__dirname + '/../tmp/' + issueKey + '.json', JSON.stringify(issue, null, 2));
		// fs.writeFileSync(__dirname + '/../tmp/' + issueKey + '.json', text);
	} catch (error) {
		console.log('==== Error:', error);

		return {};
	}

	return processIssue(issue);
}

const refetchIssue = async (key) => {
	const allIssues = get('issues');
	const prevIssueIndex = allIssues.findIndex((item) =>
		item?.jira?.key === key
	);

	if (prevIssueIndex >= 0) {
		const issue = await getIssue(key);
		const prevIssue = allIssues[prevIssueIndex];

		prevIssue.jira = issue;
		prevIssue.updated = new Date().toISOString();

		if (!prevIssue.id) {
			prevIssue.id = uuid();
		}

		set('issues', allIssues);
	} 
};

// const cache = checkCache(id);
// const url = `${JIRA_URL}/rest/agile/1.0/board/${id}/issue?expand=changelog`;

// const checkCache = (id) => {
// 	const filePath = __dirname + '/../tmp/board-' + id + '.json';

// 	if (fs.existsSync(filePath)) {
// 		try {
// 			const file = fs.readFileSync(filePath).toString();

// 			return JSON.parse(file);
// 		} catch (error) { }
// 	}

// 	return null;
// };

// const sprints = ['vklive'];
// const projects = ['vkpl'];
// const excludeTypes = ['Sub-bug', 'Sub-story', 'BugReport'];
// const excludedStatuses = ['Done'];
// const components = ['frontend desktop', 'frontend mobile', 'frontend sdk', 'frontend widgets', 'frontend devapi', 'frontend autotest'];

const IN = (list) => list.map((item) => `'${item}'`).join(', ');

const updateIssues = async () => {
	const {
		projects,
		excludeTypes,
		excludedStatuses,
		components,
	} = get('jql');

	const jql = `
		${projects.length ? `project IN (${IN(projects)}) AND` : ''}
		${excludeTypes.length ? `type NOT IN (${IN(excludeTypes)}) AND` : ''}
		${excludedStatuses.length ? `status NOT IN (${IN(excludedStatuses)}) AND` : ''}
		${components.length ? `component IN (${IN(components)}) AND` : ''}
		sprint IN openSprints()
	`.replace(/[\s\t\n]+/ig, ' ');

	console.log('==== JQL:', jql);

	const url = `${JIRA_URL}/rest/api/2/search?${new URLSearchParams({
		jql,
		maxResults: 100,
		expand: 'changelog',
		fields: 'key,summary,status,assignee,updated,created,sprint,timetracking'
	})}`;

	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${JIRA_TOKEN}`
		}
	});

	const data = await response.json();

	// TODO pagination for load more than 100 issues

	try {
		fs.writeFileSync(__dirname + '/../tmp/issues.json', JSON.stringify(data, null, 2));
	} catch (error) {
		console.log('==== Error:', error);

		return {};
	}

	const allIssues = get('issues');
	const issues = data.issues.map(processIssue);

	const payload = {};

	issues.forEach((issue) => {
		const prevIssueIndex = allIssues.findIndex((item) => item?.jira?.key === issue.key);

		if (prevIssueIndex >= 0) {
			const prevIssue = allIssues[prevIssueIndex];

			prevIssue.jira = issue;

			if (!prevIssue.base) {
				prevIssue.base = {};
			}

			prevIssue.updated = new Date().toISOString();

			payload.updated = (payload.updated || 0) + 1;

			return;
		}

		allIssues.push({
			id: uuid(),
			updated: new Date().toISOString(),
			base: {
				summary: `${issue.key}: ${issue.summary}`,
			},
			jira: issue,
		});

		payload.added = (payload.added || 0) + 1;
	});

	set('issues', allIssues);
	set('updated', new Date().toISOString());

	return payload;
};

module.exports = {
	getIssue,
	updateIssues,
	refetchIssue,
};
