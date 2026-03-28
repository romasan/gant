import { useEffect, useRef, useMemo } from 'react';

import { parseDurationToDays, isWeekend, expandWeekend } from '../../utils';
import {
	Row,
} from './components';

import cn from 'classnames';

import s from './Table.module.scss';

const firstColDay = {
	date: 'issueName',
	number: -1,
	isWeekend: false,
};

const oneDay = 1000 * 60 * 60 * 24;
const getDays = (dateRange: string[], raw: boolean, weekends: string[]): any[] => {
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
}

const getToday = (range: string[], today = new Date()) => {
	const fromDate = new Date(range[0]);

	return (today.getTime() - fromDate.getTime()) / oneDay;
};

// TODO use from db
const statuses = [ 
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
const statusWeight = (status: string) =>
	statuses.indexOf(status?.toLowerCase()) + 1;

const sortByAssignee = (a: any, b: any) =>
	(a?.base?.assignee || a?.jira?.assignee || '')?.localeCompare(b?.base?.assignee || b?.jira?.assignee || '') ||
	statusWeight(a.jira.status) - statusWeight(b.jira.status) ||
	(a?.plannedDays?.[0] || '')?.localeCompare(b?.plannedDays?.[0] || '');

const checkGroupStart = (list: any, index: number) => {
	const prev = list[index - 1];
	const next = list[index];

	return index !== 0 && (index === 1 || (prev?.base?.assignee || prev?.jira?.assignee) !== (next?.base?.assignee || next?.jira?.assignee));
}

const dateRangeFilter = (dateRange: string[]) => (item: any) => {
	// TODO filter by date range
	return true;
}

const groupFilter = (group: string) => (item: any) => {
	// TODO
	return true;
}

const issueStatusFilter = (status: string) => (item: any) => {
	// TODO
	return true;
}

const teamFilter = (team: string[]) => (item: any) =>
	(!item?.base?.assignee && !item?.jira?.assignee) || team.includes(item?.base?.assignee || item?.jira?.assignee);

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
}

const processDay = (day: any, list: any[]) => {
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
}

const processIssue = (issue: any, weekends: string[]) => {
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

interface IIssue {
	id: string;
	upated: string;
	base: any;
	jira: any;
}

interface ITableProps {
	expanded: boolean;
	dateRange: string[];
	issues: IIssue[];
	updated: string;
	team: string[];
	weekends: string[];
	delimiters: string[];
	editIssue: (value: any) => void;
}

export const Table = ({
	expanded = true,
	dateRange = [],
	issues = [],
	updated,
	team,
	weekends,
	delimiters = [],
	editIssue,
}: ITableProps) => {
	const scrollableRef = useRef(null);
	const list = useMemo(() => [{ id: '.' }].concat(
		issues
			.filter(teamFilter(team))
			// .filter(dateRangeFilter(dateRange))
			// .filter(groupFilter(selectedGroup))
			// .filter(issueStatusFilter(selectedStatus))
			.map((item) => processIssue(item, weekends))
			.sort(sortByAssignee)
	), [issues, dateRange]);
	const days = useMemo(() => [firstColDay].concat(
		getDays(dateRange, false, weekends)
			.map((item) => processDay(item, list))
	), [firstColDay, dateRange]);
	const todayOffset = getToday(dateRange);
	const updatedOffset = updated ? getToday(dateRange, new Date(updated)) : 0;
	const delimitersList = delimiters.map((delimiter) => getToday(dateRange, new Date(delimiter)))

	useEffect(() => {
		setTimeout(() => {
			(scrollableRef.current as any).scrollTo(todayOffset * 20, 0);
		}, 0);
	}, []);

	return (
		<div className={s.scrollable} ref={scrollableRef}>
			<div className={cn(s.table, {
				expanded,
			})}>
				{list.map((issue, y) => (
					<Row
						key={issue.id}
						y={y}
						days={days}
						expanded={expanded}
						issue={issue}
						startGroup={checkGroupStart(list, y)}
						editIssue={editIssue}
					/>
				))}
				<div className={s.updated} style={{
					'--expanded': expanded ? 1 : 0,
					'--blocks': updatedOffset,
				} as any} />
				<div className={s.today} style={{
					'--expanded': expanded ? 1 : 0,
					'--blocks': todayOffset,
				} as any} />
				{delimitersList.map((delimiter) => (
					<div
						key={`delimiter-${delimiter}`}
						className={s.delimiter}
						style={{
							'--expanded': expanded ? 1 : 0,
							'--blocks': delimiter,
						} as any}
					/>
				))}
			</div>
		</div>
	);
};
