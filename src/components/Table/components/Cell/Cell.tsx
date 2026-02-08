import { ReactNode } from 'react';

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
	};
	fill: any;
	issue: any;
}

export const Cell = ({
	x,
	y,
	expanded,
	title,
	day,
	fill,
	issue,
}: ICellProps) => {
	const isFirstCol = x === 0;
	const isFirstRow = y === 0;
	const hasContent = issue?.firstDay === day.date && issue?.duration;

	const getText = () => {
		if (isFirstCol && isFirstRow) { // corner
			return (
				<span className={s.firstColText}>
					Задачи
				</span>
			);
		}

		if (isFirstCol && !isFirstRow) { // left column with titles
			return (
				<span className={s.firstColText} data-type="side-cell">
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

		if (hasContent) {
			return (
				<span
					className={cn(s.duration, {
						[s.dashed]: issue?.isPlanned
					})}
					style={{
						'--cols': parseInt(issue?.duration),
					} as any}
				>
					{issue?.isPlanned && issue?.base?.summary}
				</span>
			);
		}

		return null;
	}

	if (isFirstCol && !expanded) {
		return null;
	}

	return (
		<div
			data-type="cell"
			className={cn(s.cell, {
				[s.headCell]: x > 0 && y === 0,
				[s.sideCell]: x === 0,
				[s.firstCol]: isFirstCol,
				[s.weekend]: day.isWeekend,
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
