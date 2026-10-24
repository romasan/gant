import { useEffect, useRef, useMemo, useState } from 'react';

import cn from 'classnames';

import { UNKNOWN } from '../../constants';
import { Row, Menu } from './components';
import {
	getDays,
	getToday,
	sortTable,
	checkGroupStart,
	teamFilter,
	searchNameFilter,
	dateRangeFilter,
	groupFilter,
	issueStatusFilter,
	issueTypeFilter,
	startDateFilter,
	processDay,
	processIssue,
} from './utils';

import s from './Table.module.scss';

const firstColDay = {
	date: 'issueName',
	number: -1,
	isWeekend: false,
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
	filterDateRange?: string[];
	issues: IIssue[];
	updated: string;
	team: string[];
	search: string;
	status: string;
	type: string;
	startDate: string;
	group: string;
	groups: any;
	weekends: string[];
	delimiters: string[];
	host: string;
	editIssue: (value: any) => void;
	onChange: () => void;
}

export const Table = ({
	expanded = true,
	dateRange = [],
	filterDateRange = [],
	issues = [],
	updated,
	team,
	search = '',
	status = '',
	type = '',
	startDate = '',
	group = '',
	groups = {},
	weekends,
	delimiters = [],
	host,
	editIssue,
	onChange,
}: ITableProps) => {
	const scrollableRef = useRef(null);
	const menuRef = useRef(null);

	const [menu, setMenu] = useState<any>(null);
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const getAssignee = (issue: any) => issue?.base?.assignee || issue?.jira?.assignee || UNKNOWN;

	const toggleCollapse = (assignee: string) => {
		setCollapsed((prev) => ({ ...prev, [assignee]: !prev[assignee] }));
	};

	const list = useMemo(() => [{ id: '.' }].concat(
		issues
			.filter(teamFilter(team))
			.filter(searchNameFilter(search))
			.filter(issueStatusFilter(status))
			.filter(issueTypeFilter(type))
			.filter(startDateFilter(startDate))
			.filter(groupFilter(group, groups))
			.map((item) => processIssue(item, weekends))
			.filter(dateRangeFilter(filterDateRange))
			.sort(sortTable)
	), [issues, dateRange, filterDateRange, weekends, team, search, status, type, startDate, group, groups]);
	const days = useMemo(() => [firstColDay].concat(
		getDays(dateRange, false, weekends)
			.map((item) => processDay(item, list))
	), [firstColDay, dateRange]);

	// Скрываем задачи свернутых исполнителей, оставляя строку-заголовок группы
	const visibleList = useMemo(() => {
		return list.filter((item: any, index: number) => {
			if (index === 0) {
				return true;
			}

			const assignee = getAssignee(item);
			const isGroupStart = index === 1 || getAssignee(list[index - 1]) !== assignee;

			return isGroupStart || !collapsed[assignee];
		});
	}, [list, collapsed]);
	const todayOffset = getToday(dateRange);
	const updatedOffset = updated ? getToday(dateRange, new Date(updated)) : 0;
	const delimitersList = delimiters.map((delimiter) => getToday(dateRange, new Date(delimiter)));

	const handleClick = (event: any) => {
		const { key } = event.target?.dataset || {};

		if (key) {
			const issue = Object.values(issues).find((item) => item?.id === key);

			setMenu({
				x: event.clientX,
				y: event.clientY,
				issue,
			});
		}
	};

	const closeMenu = () => {
		console.log('==== closeMenu');

		setMenu(null);
		// setMenuScreen('default');
	};

	useEffect(() => {
		if (menu) {
			const callback = (event: any) => {
				if (!(menuRef.current as any)?.contains(event.target)) {
					closeMenu();
				}
			};

			setTimeout(() => {
				document.body.addEventListener('click', callback);
			}, 0);

			return () => {
				document.body.removeEventListener('click', callback);
			};
		}
	}, [menu]);

	useEffect(() => {
		setTimeout(() => {
			(scrollableRef.current as any).scrollTo(todayOffset * 20, 0);
		}, 0);
	}, []);

	return (
		<>
			<div className={s.scrollable} ref={scrollableRef}>
				<div
					className={cn(s.table, {
						expanded,
					})}
					onClick={handleClick}
				>
					{visibleList.map((issue, y) => (
						<Row
							key={issue.id}
							y={y}
							days={days}
							expanded={expanded}
							issue={issue}
							startGroup={checkGroupStart(visibleList, y)}
							collapsed={y !== 0 && Boolean(collapsed[getAssignee(issue)])}
							onToggle={() => toggleCollapse(getAssignee(issue))}
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
			{Boolean(menu) && (
				<Menu
					menuRef={menuRef}
					menu={menu}
					team={team}
					host={host}
					editIssue={editIssue}
					onChange={onChange}
				/>
			)}
		</>
	);
};
