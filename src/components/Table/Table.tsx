import { useEffect, useRef, useMemo, useState } from 'react';

import cn from 'classnames';

import { Row, Menu } from './components';
import {
	getDays,
	getToday,
	sortTable,
	checkGroupStart,
	teamFilter,
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
	issues: IIssue[];
	updated: string;
	team: string[];
	weekends: string[];
	delimiters: string[];
	editIssue: (value: any) => void;
	onChange: () => void;
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
	onChange,
}: ITableProps) => {
	const scrollableRef = useRef(null);
	const menuRef = useRef(null);

	const [menu, setMenu] = useState<any>(null);

	const list = useMemo(() => [{ id: '.' }].concat(
		issues
			.filter(teamFilter(team))
			// .filter(dateRangeFilter(dateRange))
			// .filter(groupFilter(selectedGroup))
			// .filter(issueStatusFilter(selectedStatus))
			.map((item) => processIssue(item, weekends))
			.sort(sortTable)
	), [issues, dateRange]);
	const days = useMemo(() => [firstColDay].concat(
		getDays(dateRange, false, weekends)
			.map((item) => processDay(item, list))
	), [firstColDay, dateRange]);
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
			{Boolean(menu) && (
				<Menu
					menuRef={menuRef}
					menu={menu}
					team={team}
					editIssue={editIssue}
					onChange={onChange}
				/>
			)}
		</>
	);
};
