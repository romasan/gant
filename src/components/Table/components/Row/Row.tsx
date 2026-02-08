import { ReactNode } from 'react';

import cn from 'classnames';

import { Cell } from '../Cell/';

import s from './Row.module.scss';

interface IRowProps {
	y: number;
	days: any[];
	expanded: boolean;
	issue: any;
	startGroup: boolean;
	editIssue: (value: any) => void;
}

export const Row = ({
	y,
	days,
	expanded,
	issue,
	startGroup,
	editIssue,
}: IRowProps) => {
	const edit = (event: any) => {
		event.preventDefault();
		editIssue(issue);
	};

	const getTitle = () => {
		const status = (issue?.jira?.statuses?.slice(-1)?.pop()?.to || issue?.jira?.status)?.toLowerCase()?.replace(/\s/ig, '');

		return (
			<div>
				{Boolean(status) && (
					<span
						className={cn(s.badge, {
							[s.devready]: ['devready', 'новый'].includes(status),
							[s.develop]: ['develop', 'inprogress'].includes(status),
							[s.review]: status === 'review',
							[s.testready]: status === 'testready',
							[s.testing]: status === 'testing',
							[s.testdone]: status === 'testdone',
							[s.deploy]: status === 'deploy',
							[s.designreview]: status === 'designreview',
							[s.awaiting]: status === 'awaiting',
							[s.waitingforrelated]: status === 'waitingforrelated',
							[s.done]: ['done', 'закрыт', 'closed'].includes(status),
						})}
					/>
				)}
				<a
					href={issue?.jira?.key ? `https://jira.vk.team/browse/${issue?.jira?.key}` : '#'}
					target="_blank"
					onClick={edit}
				>
					{issue?.base?.summary}
				</a>
			</div>
		);
	};

	return (
		<>
			{startGroup && (
				<div className={s.group} data-type="group-delimiter">
					<span>{issue?.base?.assignee || issue?.jira?.assignee || 'Не назначена'}</span>
				</div>
			)}
			<div
				data-type="row"
				className={cn(s.row, {
					[s.tableHead]: y === 0,
				})}
			>
				{days.map((day, x) => (
					<Cell
						key={`${day.date}-${y}`}
						day={day}
						x={x}
						y={y}
						expanded={expanded}
						fill={issue?.days?.[day?.date]}
						title={x === 0 ? getTitle() as ReactNode : ''}
						issue={issue}
					/>
				))}
			</div>
		</>
	);
};