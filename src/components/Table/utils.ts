import { parseDurationToDays, isWeekend, expandWeekend } from '../../utils';
import { UNKNOWN } from '../../constants';

export const oneDay = 1000 * 60 * 60 * 24;

// TODO use from db
export const statuses = [
	'открытый',
	'новый',
	'devready',
	'design',
	'waiting for related',
	'develop',
	'в работе',
	'review',
	'testready',
	'тестирование',
	'testdone',
	'design review',
	'deploy',
	'готово',
	'закрыт',
];

export const getDays = (dateRange: string[], raw: boolean, weekends: string[]): any[] => {
	const [dateFrom, dateTo] = dateRange;
	const days = [dateFrom];
	const from = new Date(dateFrom).getTime();
	const to = new Date(dateTo).getTime();

	if (from !== to) {
		let next = from + oneDay;

		while (next <= to) {
			const date = new Date(next).toISOString().split('T')[0];

			days.push(date);
			// TODO current.setDate(current.getDate() + 1);
			next += oneDay;
		}
	}

	if (raw) {
		return days;
	}

	return days.map((day) => {
		const dateTime = new Date(day);

		return {
			date: day,
			number: dateTime.getDate(),
			isWeekend: isWeekend(dateTime, weekends),
		}
	});
};


export const getToday = (range: string[], today = new Date()) => {
	const fromDate = new Date(range[0]);

	return (today.getTime() - fromDate.getTime()) / oneDay;
};

const statusWeight = (status: string) =>
	statuses.indexOf(status?.toLowerCase()) + 1;

const sortByAssignee = (a: any, b: any) => {
	if (a?.base?.assignee === UNKNOWN) {
		return -1;
	}

	if (b?.base?.assignee === UNKNOWN) {
		return 1;
	}

	return (a?.base?.assignee || a?.jira?.assignee || '')?.localeCompare(b?.base?.assignee || b?.jira?.assignee || '');
}

export const sortTable = (a: any, b: any) =>
	sortByAssignee(a, b) ||
	statusWeight(a.jira.status) - statusWeight(b.jira.status) ||
	(a?.plannedDays?.[0] || '')?.localeCompare(b?.plannedDays?.[0] || '');

export const checkGroupStart = (list: any, index: number) => {
	const prev = list[index - 1];
	const next = list[index];

	return index !== 0 && (index === 1 || (prev?.base?.assignee || prev?.jira?.assignee) !== (next?.base?.assignee || next?.jira?.assignee));
};

// Текущий статус задачи: последний переход в истории статусов, иначе jira.status
export const getIssueStatus = (item: any) => {
	const history = item?.jira?.statuses;

	return (history?.length ? history[history.length - 1]?.to : item?.jira?.status) || '';
};

// Оставить задачи, дни которых попадают в выбранный диапазон (без дат — оставляем)
export const dateRangeFilter = (dateRange: string[]) => (item: any) => {
	const [from, to] = dateRange || [];

	if (!from || !to) {
		return true;
	}

	const days = item?.plannedDays?.length
		? item.plannedDays
		: (item?.firstDay ? [item.firstDay] : []);

	if (!days.length) {
		return true;
	}

	return days.some((day: string) => day >= from && day <= to);
};

// Группа участников: '' — все, 'sync' — рассинхрон назначенного, иначе имя группы из db.groups
export const groupFilter = (group: string, groups: any = {}) => (item: any) => {
	if (!group) {
		return true;
	}

	const assignee = item?.base?.assignee || item?.jira?.assignee;

	if (group === 'sync') {
		return Boolean(item?.base?.assignee && item?.jira?.assignee && item.base.assignee !== item.jira.assignee);
	}

	const members = groups?.[group];

	return Array.isArray(members) ? members.includes(assignee) : true;
};

export const issueStatusFilter = (status: string) => (item: any) =>
	!status || getIssueStatus(item).toLowerCase() === status.toLowerCase();

export const issueTypeFilter = (type: string) => (item: any) =>
	!type || (item?.jira?.type || '') === type;

// '' / 'any' — любая, 'has' — есть дата начала, 'none' — нет даты начала
export const startDateFilter = (mode: string) => (item: any) => {
	if (!mode || mode === 'any') {
		return true;
	}

	const hasStart = Boolean(item?.base?.startDate || item?.jira?.targetStart);

	return mode === 'has' ? hasStart : !hasStart;
};

export const teamFilter = (team: string[]) => (item: any) =>
	(!item?.base?.assignee && !item?.jira?.assignee) || [UNKNOWN, ...team].includes(item?.base?.assignee || item?.jira?.assignee);

export const searchNameFilter = (search: string) => (item: any) =>
	!search.trim() || (item?.base?.summary || '').toLowerCase().includes(search.trim().toLowerCase());

const prolongStatuses = (statuses: any[], weekends: string[]) => {
	const from = statuses[0].date.split('T')[0];
	const to = statuses[statuses.length - 1].to.toLowerCase() === 'done'
		? statuses[statuses.length - 1].date.split('T')[0]
		: new Date().toISOString().split('T')[0];
	const days = getDays([from, to], true, weekends);
	let current: any = null;

	return days.map((day) => {
		const status = statuses
			.filter((item) => item.date.split('T')[0] === day)
			.pop();

		if (status) {
			current = status;
		}

		return {
			date: day,
			to: current.to,
		}
	});
};

export const processDay = (day: any, list: any[]) => {
	const counts = list.reduce((obj, issue) => {
		const assignee = issue?.base?.assignee || issue?.jira?.assignee;

		if (assignee && issue?.plannedDays?.includes(day.date)) {
			return {
				...obj,
				[assignee]: (obj[assignee] || 0) + 1,
			};
		}

		return obj;
	}, 0);

	day.counts = counts;

	return day;
};

export const processIssue = (issue: any, weekends: string[]) => {
	if (issue?.jira?.statuses?.length) {
		const firstDay = issue?.jira?.statuses
			?.find((item: any) => ['develop', 'in progress'].includes(item.to.toLowerCase()))
			?.date?.split('T')?.[0];
		const lastStatus = issue?.jira?.statuses[issue?.jira?.statuses?.length - 1]?.to?.toLowerCase();

		if (firstDay && !['new', 'devready'].includes(lastStatus)) {
			issue.firstDay = firstDay;

			if (issue?.jira?.timetracking) {
				const duration = parseDurationToDays(issue?.jira?.timetracking);

				issue.duration = expandWeekend(firstDay, duration, weekends);
			} else if (issue?.base?.duration) {
				issue.duration = expandWeekend(firstDay, issue?.base?.duration, weekends);
			}
		} else if (
			issue?.base?.startDate &&
			issue?.base?.duration
		) {
			const duration = parseInt(issue?.base?.duration);

			issue.duration = expandWeekend(issue?.base?.startDate, duration, weekends);
			issue.firstDay = issue?.base?.startDate;
			issue.isPlanned = true;
		}

		issue.days = prolongStatuses(issue.jira.statuses, weekends)
			.reduce((list: any, item: any) => ({
				...list,
				[item.date.split('T')[0]]: item.to.toLowerCase().replace(/\s/ig, ''),
			}), {});
	} else if (
		!issue.firstDay &&
		issue?.base?.startDate &&
		issue?.base?.duration
	) {
		const duration = parseInt(issue?.base?.duration);

		issue.duration = expandWeekend(issue?.base?.startDate, duration, weekends);
		issue.firstDay = issue?.base?.startDate;
		issue.isPlanned = true;
	}

	if (issue.firstDay && issue.duration) {
		const lastDay = new Date(issue.firstDay);

		lastDay.setDate(lastDay.getDate() + issue.duration - 1);
		issue.plannedDays = getDays([issue.firstDay, lastDay.toISOString().split('T')[0]], true, weekends);
	}

	return issue;
};
