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
		const needCheckPerformer = issue?.base?.assignee && issue?.jira?.assignee && (issue?.base?.assignee !== issue?.jira?.assignee);
		const onBoard = Boolean(issue?.duration || issue?.firstDay);
		const tooFast = issue?.jira?.targetStart && issue?.firstDay < issue.jira.targetStart;

		return (
			<div>
				{Boolean(status) && (
					<span
						className={cn(s.badge, {
							[s.blocked]: status === 'blocked',
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
							[s.needCheckPerformer]: needCheckPerformer,
						})}
					/>
				)}
				<a
					href={issue?.jira?.key ? `https://jira.vk.team/browse/${issue?.jira?.key}` : '#'}
					target="_blank"
					onClick={edit}
					className={cn({
						[s.needCheckPerformer]: needCheckPerformer,
					})}
				>
					{tooFast && '🏃 '}
					{!onBoard && '🚧 '}
					{needCheckPerformer && '👥 '}
					{issue?.base?.summary}
				</a>
			</div>
		);
	};

	return (
		<>
			{startGroup && (
				<>
					<div className={s.group}>
						<span>{issue?.base?.assignee || issue?.jira?.assignee || 'Не назначена'}</span>
					</div>
					<div style={{position:'relative'}}>
						<div style={{position:'absolute',display:'flex',top:'-20px'}}>
							{days.map((day, x) => (
								<Cell
									key={`group-${day.date}-${y}`}
									day={day}
									x={x}
									y={y}
									expanded={expanded}
									fill={''}
									title={'A'}
									issue={issue}
									group={true}
								/>
							))}
						</div>
					</div>
				</>
			)}
			<div className={cn(s.row, {
				[s.tableHead]: y === 0,
			})}>
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