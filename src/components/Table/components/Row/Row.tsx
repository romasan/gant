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

	const getTitle = () => (
		<a href={issue?.jira?.key ? `https://jira.vk.team/browse/${issue?.jira?.key}` : '#'} target="_blank" onClick={edit}>
			{issue?.base?.summary}
		</a>
	);

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