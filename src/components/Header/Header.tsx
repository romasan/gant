import { useState, useEffect } from 'react';

import s from './Header.module.scss';

interface IProps {
	expanded: boolean;
	drawer: string;
	dateRange?: string[],
	toggle: () => void;
	setModal: (value: string) => void;
	setDrawer: (value: string) => void;
}

export const Header = ({
	expanded,
	drawer,
	dateRange,
	toggle,
	setModal,
	setDrawer,
}: IProps) => {
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const today = new Date(new Date().toISOString().split('T')[0]).getTime();
	const from = new Date(dateFrom).getTime();
	const to = new Date(dateTo).getTime();

	const updateFrom = (event: any) => {
		const value = new Date(event.target.value).getTime();

		if (value > today || value > to) {
			alert('такую дату поставить не получится');

			return;
		}

		setDateFrom(event.target.value);
	};

	const updateTo = (event: any) => {
		const value = new Date(event.target.value).getTime();

		if (value < today || value < from) {
			alert('такую дату поставить не получится');

			return;
		}

		setDateTo(event.target.value);
	};

	useEffect(() => {
		if (dateRange?.length) {
			const [from, to] = dateRange;

			setDateFrom(from);
			setDateTo(to);
		}
	}, [dateRange]);

	return (
		<div className={s.root}>
			<div className={s.left}>
				<button onClick={toggle}>{expanded ? '⬅️' : '➡️'}</button>
				<h1>Гант</h1>
				&nbsp;
				{/* <input type="date" onChange={updateFrom} value={dateFrom} /> */}
				{/* min="2025-06-01" */}
				{/* <input type="date" onChange={updateTo} value={dateTo} /> */}
				{/* <button>показать</button> */}
				{/* · */}
				<select>
					<option>все</option>
					<option>все кроме лида</option>
					<option>группа 1234</option>
				</select>
				·
				<button onClick={() => setModal('task')}>добавить задачу</button>
				{/* <button>Распределить неназначенные</button> */}
				{/* · */}
				<button onClick={() => setDrawer(drawer === 'command' ? '' : 'command')}>команда</button>
			</div>
			<div className={s.right}>
				<button onClick={() => setModal('legend')}>легенда</button>
				<button onClick={() => setDrawer('settings')}>⚙️</button>
			</div>
		</div>
	);
};
