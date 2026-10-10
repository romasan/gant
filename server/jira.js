const fs = require('fs');
const { v4: uuid } = require('uuid');
const { createJiraClient, extractErrorMessage } = require('@vklive/jira');
const { get, set } = require('./db');
require('dotenv').config();

const {
	JIRA_URL,
	JIRA_TOKEN,
} = process.env;

// Клиент Jira из npm-пакета @vklive/jira: адрес и токен передаются аргументами,
// самописный fetch-код и сборка URL заменены на методы пакета.
// notAssigned совпадает с UNKNOWN из src/constants.ts («Не назначена»).
const jira = createJiraClient({
	url: JIRA_URL,
	token: JIRA_TOKEN,
	notAssigned: 'Не назначена',
});

// Поля задачи, которые запрашиваются у Jira.
const FIELDS = ['key', 'summary', 'status', 'assignee', 'updated', 'created', 'sprint', 'timetracking', 'priority'];

// История статусов и Target start/end собираются из changelog, поэтому все запросы идут с expand.
const EXPAND = 'changelog';

// Сырые ответы Jira сохраняются в tmp/ для отладки; ошибка записи не прерывает обработку.
const writeTmp = (name, data) => {
	try {
		fs.writeFileSync(__dirname + '/../tmp/' + name + '.json', JSON.stringify(data, null, 2));
	} catch (error) {
		console.log('==== Error:', error);
	}
};

// Общие поля (key, summary, status, assignee, priority) берём из нормализации @vklive/jira,
// историю статусов и Target start/end — из changelog сырого ответа (issue.raw).
const processIssue = (issue) => {
	const fields = issue.fields || {};
	const histories = issue.raw?.changelog?.histories || [];

	const statuses = histories.map((item) => {
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

	const targets = histories.map((item) =>
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

	return {
		key: issue.key,
		status: issue.status,
		summary: issue.summary,
		assignee: issue.assignee,
		statuses,
		updatedDate: fields.updated,
		resolvedDate: fields.resolutiondate,
		createdDate: fields.created,
		timetracking: fields.timetracking?.originalEstimate,
		targetStart,
		targetEnd,
		priority: issue.priority,
	};
}

const getIssue = async (issueKey) => {
	// Нормализованная задача пакета + сырой ответ (raw) для changelog
	const issue = await jira.getIssueFullData(issueKey, { fields: FIELDS, expand: EXPAND });

	writeTmp(issue.key, issue.raw);

	try {
		return processIssue(issue);
	} catch (error) {
		console.log('==== Error:', error);

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

const IN = (list) => list.map((item) => `'${item}'`).join(', ');

const updateIssues = async (onProgress) => {
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

	return await getRandomJql(jql, true, onProgress);
};

const getRandomJql = async (jql, inSprint = false, onProgress) => {
	console.log('==== JQL:', jql);

	let allDataIssues;

	try {
		// all: true перебирает все страницы (по 100 задач) — вместо ручного цикла по startAt.
		// Каждая страница отдаётся в onPage и сохраняется в tmp/issues.json для отладки.
		// onProgress сообщает обработанное/общее число задач (по startAt/total страницы) —
		// это и есть реальный прогресс синхронизации для SSE-стрима.
		allDataIssues = await jira.searchIssues(jql, {
			fields: FIELDS,
			expand: EXPAND,
			full: false,
			all: true,
			pageSize: 100,
			onPage: (data) => {
				writeTmp('issues', data);

				if (typeof onProgress === 'function') {
					const processed = (data.startAt || 0) + (data.issues?.length || 0);
					const total = Number.isFinite(data.total) ? data.total : processed;

					onProgress({ processed, total });
				}
			},
		});
	} catch (error) {
		console.log('==== catch', String(error));

		// текст ошибки Jira берём из ответа (errorMessages), а не из AxiosError.message
		return {
			error: extractErrorMessage(error),
			jql,
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
