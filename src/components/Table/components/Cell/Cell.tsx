import { ReactNode } from 'react';
import { countDaysBetween } from '../../../../utils';

import cn from 'classnames';

import s from './Cell.module.scss';

const months = [
	'янв',
	'фев',
	'мар',
	'апр',
	'май',
	'июн',
	'июл',
	'авг',
	'сен',
	'окт',
	'ноя',
	'дек',
];
const getMonth = (date: string) => months[new Date(date).getMonth()];

interface ICellProps {
	x: number;
	y: number;
	expanded: boolean;
	title?: string | ReactNode;
	day: {
		date: string;
		number: number;
		isWeekend: boolean;
		counts: any;
	};
	fill: any;
	issue: any;
	group?: boolean;
}

export const Cell = ({
	x,
	y,
	expanded,
	title,
	day,
	fill,
	issue,
	group,
}: ICellProps) => {
	const isFirstCol = x === 0;
	const isFirstRow = y === 0;

	const withTarget = issue?.jira?.targetStart && issue?.jira?.targetEnd;
	const moved = issue?.jira?.targetStart && issue?.jira?.targetStart !== issue.base.startDate;
	const hasContent = (withTarget && !moved)
		? issue.jira.targetStart === day.date
		: issue?.firstDay === day.date && issue?.duration;

	const getText = () => {
		if (isFirstCol && isFirstRow) { // corner
			return (
				<span className={s.firstColText}>
					Задачи
				</span>
			);
		}

		if (isFirstCol && !isFirstRow) { // left column with titles
			// const setted = (issue?.firstDay && issue?.jira?.timetracking) || (issue?.base?.startDate && issue?.base?.duration);
			// const withTarget = issue.jira.targetStart && issue.jira.targetEnd;

			return (
				<span className={cn(s.firstColText, {
					[s.inSprint]: issue?.jira?.inSprint,
					[s.isOk]: withTarget,
				})} data-type="side-cell">
					{title}
				</span>
			);
		}

		if (!isFirstCol && isFirstRow) { // header with date
			return (
				<>
					<span title={day.date}>{day.number}</span>
					{day.number === 1 && (
						<span className={s.month}>{getMonth(day.date)}</span>
					)}
				</>
			);
		}

		if (hasContent) { // start of range
			const today = new Date().toISOString().split('T')[0];
			const isExpired = issue?.isPlanned && issue.jira?.key && new Date(today).getTime() > new Date(issue.firstDay).getTime();
			const isDuty = issue?.base?.summary?.toLowerCase() === 'дежурство';
			// const isTargetStartCell = withTarget && !moved && day.date === issue.jira.targetStart;
			const duration = (withTarget && !moved) 
				? countDaysBetween(issue.jira.targetStart, issue.jira.targetEnd) + 1
				: issue?.duration;

			return (
				<span
					className={cn(s.duration, {
						[s.dashed]: issue?.isPlanned,
						[s.withTarget]: withTarget,
						[s.moved]: moved,
						[s.expired]: isExpired,
						[s.duty]: isDuty,
					})}
					style={{
						'--cols': parseInt(duration),
					} as any}
					data-key={issue?.id}
				>
					{issue?.isPlanned && issue?.base?.summary}
				</span>
			);
		}

		return null;
	}

	const getGroupContent = () => {
		if (isFirstCol || day.isWeekend) {
			return '';
		}

		const today = new Date().toISOString().split('T')[0];

		if (new Date(day.date).getTime() < new Date(today).getTime()) {
			return '';
		}

		const assignee = issue?.base?.assignee || issue?.jira?.assignee;

		if (!assignee) {
			return '';
		}

		const count = day?.counts?.[assignee] || 0;
		
		return (
			<div className={cn(s.circle, {
				[s.red]: count > 1,
				[s.green]: count === 0,
				[s.blue]: count === 1,
			})} />
		);
	}

	if (isFirstCol && !expanded) {
		return null;
	}

	if (isFirstCol && expanded && group) {
		return <div className={s.firstCol} />
	}

	if (group) {
		return (
			<div className={s.groupCell}>
				{getGroupContent()}
			</div>
		);
	}

	return (
		<div
			className={cn(s.cell, {
				[s.headCell]: !isFirstCol && isFirstRow,
				[s.firstCol]: isFirstCol,
				[s.weekend]: day.isWeekend,
				[s.blocked]: fill === 'blocked',
				[s.devready]: fill === 'devready',
				[s.develop]: ['develop', 'inprogress'].includes(fill),
				[s.review]: fill === 'review',
				[s.testready]: fill === 'testready',
				[s.testing]: fill === 'testing',
				[s.testdone]: fill === 'testdone',
				[s.deploy]: fill === 'deploy',
				[s.designreview]: fill === 'designreview',
				[s.awaiting]: fill === 'awaiting',
				[s.waitingforrelated]: fill === 'waitingforrelated',
			})}
		>
			{getText()}
		</div>
	);
};
