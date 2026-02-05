import { useEffect, useRef, useMemo } from 'react';

import { parseDurationToDays, isDayOff, expandDayoff } from '../../utils';
import {
	Row,
} from './components';

import cn from 'classnames';

import s from './Table.module.scss';

const firstColDay = {
	date: 'issueName',
	number: -1,
	isDayOff: false,
};
const oneDay = 1000 * 60 * 60 * 24;
const getDays = (dateRange: string[], raw?: boolean): any[] => {
	const [dateFrom, dateTo] = dateRange;
	const days = [dateFrom];
	const from = new Date(dateFrom).getTime();
	const to = new Date(dateTo).getTime();

	if (from !== to) {
		let next = from + oneDay;
		while (next <= to) {
			const date = new Date(next).toISOString().split('T')[0];

			days.push(date);
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
			isDayOff: isDayOff(dateTime),
		}
	});
}

const getToday = (range: string[]) => {
	const today = new Date();
	const fromDate = new Date(range[0]);

	return (today.getTime() - fromDate.getTime()) / oneDay;
};

// const some = (obj: any, keys: string[]) => keys.some((key) => typeof obj[key] !== 'undefined');

const sortByAssignee = ([, a]: any, [, b]: any) =>
	(a?.base?.assignee || a?.jira?.assignee) > (b?.base?.assignee || b?.jira?.assignee) ? 1 : -1;

const checkGroupStart = (list: any, index: number) => {
	const prev = list[index - 1]?.[1];
	const next = list[index]?.[1];

	return index !== 0 && (index === 1 || (prev?.base?.assignee || prev?.jira?.assignee) !== (next?.base?.assignee || next?.jira?.assignee));
}

const dateRangeFilter = (dateRange: string[]) => ([, item]: any) => {
	// TODO
	return true;
}

const teamFilter = (team: string[]) => ([, item]: any) =>
	(!item?.base?.assignee && !item?.jira?.assignee) || team.includes(item?.base?.assignee || item?.jira?.assignee);

const prolongStatuses = (statuses: any[]) => {
	const from = statuses[0].date.split('T')[0];
	const to = statuses[statuses.length - 1].to.toLowerCase() === 'done'
		? statuses[statuses.length - 1].date.split('T')[0]
		: new Date().toISOString().split('T')[0];
	const days = getDays([from, to], true);
	let current: any = null;

	return days.map((day) => {
		const status = statuses.filter((item) => item.date.split('T')[0] === day).pop();

		if (status) {
			current = status;
		}

		return {
			date: day,
			to: current.to,
		}
	});
}

const processIssueDays = (issueDay: any) => {
	// if (issueDay[1]?.base?.summary?.includes('2299')) {
	// 	console.log('==== processIssueDays', issueDay);
	// }

	if (issueDay[1]?.jira?.statuses?.length) {
		const firstDay = issueDay[1]?.jira?.statuses
			?.find((item: any) => item.to.toLowerCase() === 'develop')
			?.date?.split('T')?.[0];
		const lastStatus = issueDay[1]?.jira?.statuses[issueDay[1]?.jira?.statuses?.length - 1]?.to?.toLowerCase();

		if (firstDay && !['new', 'devready'].includes(lastStatus)) {
			issueDay[1].firstDay = firstDay;

			if (issueDay[1]?.jira?.timetracking) {
				const duration = parseDurationToDays(issueDay[1]?.jira?.timetracking);

				issueDay[1].duration = expandDayoff(firstDay, duration);
			} else if (issueDay[1]?.base?.duration) {
				issueDay[1].duration = expandDayoff(firstDay, issueDay[1]?.base?.duration);;
			}
		} else if (
			issueDay[1]?.base?.startDate &&
			issueDay[1]?.base?.duration
		) {
			const duration = parseInt(issueDay[1]?.base?.duration);

			issueDay[1].duration = expandDayoff(issueDay[1]?.base?.startDate, duration);
			issueDay[1].firstDay = issueDay[1]?.base?.startDate;
			issueDay[1].isPlanned = true;
		}

		issueDay[1].days = prolongStatuses(issueDay[1].jira.statuses).reduce((list: any, item: any) => ({
			...list,
			[item.date.split('T')[0]]: item.to.toLowerCase().replace(/\s/ig, ''),
		}), {});
	} else if (
		!issueDay[1].firstDay &&
		issueDay[1]?.base?.startDate &&
		issueDay[1]?.base?.duration
	) {
		const duration = parseInt(issueDay[1]?.base?.duration);

		issueDay[1].duration = expandDayoff(issueDay[1]?.base?.startDate, duration);
		issueDay[1].firstDay = issueDay[1]?.base?.startDate;
		issueDay[1].isPlanned = true;
	}

	return issueDay;
};

interface ITableProps {
	expanded: boolean;
	dateRange: string[];
	issues: any;
	updated: string;
	team: string[];
	editIssue: (value: any) => void;
}

export const Table = ({
	expanded = true,
	dateRange = [],
	issues = {},
	updated,
	team,
	editIssue,
}: ITableProps) => {
	const list = useMemo(() => [['.', {}]].concat(
		Object.entries(issues)
			.filter(dateRangeFilter(dateRange))
			.filter(teamFilter(team))
			.map(processIssueDays)
			.sort(sortByAssignee)
	), [issues, dateRange]);
	const days = useMemo(() => [firstColDay].concat(getDays(dateRange)), [firstColDay, dateRange]);
	const todayOffset = getToday(dateRange);
	const updatedOffset = updated ? getToday([dateRange[0], updated]) : 0;
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
				{list.map(([key, issue], y) => (
					<Row
						key={key as string}
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
