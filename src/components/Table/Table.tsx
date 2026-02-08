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

// const some = (obj: any, keys: string[]) => keys.some((key) => typeof obj[key] !== 'undefined');

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
	// (a?.base?.assignee || a?.jira?.assignee) > (b?.base?.assignee || b?.jira?.assignee) ? 1 : -1;
	(a?.base?.assignee || a?.jira?.assignee)?.localeCompare(b?.base?.assignee || b?.jira?.assignee) ||
	statusWeight(a.jira.status) - statusWeight(b.jira.status)

const checkGroupStart = (list: any, index: number) => {
	const prev = list[index - 1];
	const next = list[index];

	return index !== 0 && (index === 1 || (prev?.base?.assignee || prev?.jira?.assignee) !== (next?.base?.assignee || next?.jira?.assignee));
}

const dateRangeFilter = (dateRange: string[]) => (item: any) => {
	// TODO filter by date range
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

const processIssueDays = (issueDay: any, weekends: string[]) => {
	// if (issueDay[1]?.base?.summary?.includes('2299')) {
	// 	console.log('==== processIssueDays', issueDay);
	// }

	if (issueDay?.jira?.statuses?.length) {
		const firstDay = issueDay?.jira?.statuses
			?.find((item: any) => ['develop', 'in progress'].includes(item.to.toLowerCase()))
			?.date?.split('T')?.[0];
		const lastStatus = issueDay?.jira?.statuses[issueDay?.jira?.statuses?.length - 1]?.to?.toLowerCase();

		if (firstDay && !['new', 'devready'].includes(lastStatus)) {
			issueDay.firstDay = firstDay;

			if (issueDay?.jira?.timetracking) {
				const duration = parseDurationToDays(issueDay?.jira?.timetracking);

				issueDay.duration = expandWeekend(firstDay, duration, weekends);
			} else if (issueDay?.base?.duration) {
				issueDay.duration = expandWeekend(firstDay, issueDay?.base?.duration, weekends);
			}
		} else if (
			issueDay?.base?.startDate &&
			issueDay?.base?.duration
		) {
			const duration = parseInt(issueDay?.base?.duration);

			issueDay.duration = expandWeekend(issueDay?.base?.startDate, duration, weekends);
			issueDay.firstDay = issueDay?.base?.startDate;
			issueDay.isPlanned = true;
		}

		issueDay.days = prolongStatuses(issueDay.jira.statuses, weekends)
			.reduce((list: any, item: any) => ({
				...list,
				[item.date.split('T')[0]]: item.to.toLowerCase().replace(/\s/ig, ''),
			}), {});
	} else if (
		!issueDay.firstDay &&
		issueDay?.base?.startDate &&
		issueDay?.base?.duration
	) {
		const duration = parseInt(issueDay?.base?.duration);

		issueDay.duration = expandWeekend(issueDay?.base?.startDate, duration, weekends);
		issueDay.firstDay = issueDay?.base?.startDate;
		issueDay.isPlanned = true;
	}

	// if (issueDay?.jira?.key?.includes('12770')) {
	// 	console.log('==== processIssueDays', issueDay);
	// }

	return issueDay;
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
	editIssue: (value: any) => void;
}

export const Table = ({
	expanded = true,
	dateRange = [],
	issues,
	updated,
	team,
	weekends,
	editIssue,
}: ITableProps) => {
	const list = useMemo(() => [{ id: '.' }].concat(
		issues
			.filter(dateRangeFilter(dateRange))
			.filter(teamFilter(team))
			.map((item) => processIssueDays(item, weekends))
			.sort(sortByAssignee)
	), [issues, dateRange]);
	const days = useMemo(() => [firstColDay].concat(getDays(dateRange, false, weekends)), [firstColDay, dateRange]);
	const todayOffset = getToday(dateRange);
	const updatedOffset = updated ? getToday(dateRange, new Date(updated)) : 0;
	const scrollableRef = useRef(null);

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
				} as any}></div>
				<div className={s.today} style={{
					'--expanded': expanded ? 1 : 0,
					'--blocks': todayOffset,
				} as any}></div>
			</div>
		</div>
	);
};
