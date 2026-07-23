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

	const targets = issue.changelog.histories.map((item) =>
		item.items.filter((v) => ['Target start', 'Target end'].includes(v.field))
	)
		.reduce((item, list) => ([...list, ...item]), []);

	const targetStart = targets
		.filter((item) => item.field === 'Target start')
		.shift()
		?.to;

	const targetEnd = targets
		.filter((item) => item.field === 'Target end')
		.shift()
		?.to;

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
		targetStart,
		targetEnd,
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

	try {
		return processIssue(issue);
	} catch (error) {
		return { error: true };
	}
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
		sprints,
	} = get('jql');

	const jql = `
		${projects.length ? `project IN (${IN(projects)}) AND` : ''}
		${excludeTypes.length ? `type NOT IN (${IN(excludeTypes)}) AND` : ''}
		${excludedStatuses.length ? `status NOT IN (${IN(excludedStatuses)}) AND` : ''}
		${components.length ? `component IN (${IN(components)}) AND` : ''}
		(
			sprint IN openSprints()
			${sprints.length ? `OR sprint IN (${IN(sprints)})` : ''}
		)
	`.replace(/[\s\t\n]+/ig, ' ').trim();

	return await getRandomJql(jql, true);
};

const getRandomJql = async (jql, inSprint = false) => {
	console.log('==== JQL:', jql);

	let allDataIssues = [];
	let startAt = 0;
	const maxResults = 100;
	let total;

	try {
		do {
			const url = `${JIRA_URL}/rest/api/2/search?${new URLSearchParams({
				jql,
				maxResults,
				startAt,
				expand: 'changelog',
				fields: 'key,summary,status,assignee,updated,created,sprint,timetracking'
			})}`;
	
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${JIRA_TOKEN}`
				}
			});
	
			const data = await response.json();

			if (data?.errorMessages?.length) {
				throw new Error(data.errorMessages.join('\n'));
			}
	
			if (total === undefined) {
				total = data.total;
			}
	
			allDataIssues = allDataIssues.concat(data.issues);
			startAt += maxResults;
	
			try {
				fs.writeFileSync(__dirname + '/../tmp/issues.json', JSON.stringify(data, null, 2));
			} catch (error) {
				console.log('==== Error:', error);
	
				return {};
			}
		} while (startAt < total);
	} catch (error) {
		console.log('==== catch', String(error));
		return {
			error: String(error),
		}
	}

	console.log('==== ok');

	const allIssues = get('issues');
	const issues = allDataIssues
		.map(processIssue)
		.map((issue) => {
			issue.inSprint = inSprint;

			return issue;
		});

	const payload = {
		jql,
	};

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
	getRandomJql,
};
