import { useState, useEffect } from 'react';

import s from './Header.module.scss';

interface IProps {
	expanded: boolean;
	drawer: string;
	dateRange?: string[],
	search: string;
	status: string;
	statuses: string[];
	type: string;
	types: string[];
	startDate: string;
	group: string;
	groups: any;
	toggle: () => void;
	setModal: (value: string) => void;
	setDrawer: (value: string) => void;
	setSearch: (value: string) => void;
	setStatus: (value: string) => void;
	setType: (value: string) => void;
	setStartDate: (value: string) => void;
	setGroup: (value: string) => void;
	setDateRange: (value: string[]) => void;
}

export const Header = ({
	expanded,
	drawer,
	dateRange,
	search = '',
	status = '',
	statuses = [],
	type = '',
	types = [],
	startDate = '',
	group = '',
	groups = {},
	toggle,
	setModal,
	setDrawer,
	setSearch,
	setStatus,
	setType,
	setStartDate,
	setGroup,
	setDateRange,
}: IProps) => {
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	// после очистки ❌ не подставляем диапазон из db обратно в поля
	const [dateCleared, setDateCleared] = useState(false);

	const updateFrom = (event: any) => {
		const value = event.target.value;
		const to = dateTo || value;

		if (!value) {
			return;
		}

		if (value > to) {
			alert('такую дату поставить не получится');

			return;
		}

		setDateCleared(false);
		setDateFrom(value);
		setDateRange([value, to]);
	};

	const updateTo = (event: any) => {
		const value = event.target.value;
		const from = dateFrom || value;

		if (!value) {
			return;
		}

		if (value < from) {
			alert('такую дату поставить не получится');

			return;
		}

		setDateCleared(false);
		setDateTo(value);
		setDateRange([from, value]);
	};

	// Сброс фильтра по датам: поля пустые, диаграмма — диапазон из db
	const clearDates = () => {
		setDateCleared(true);
		setDateFrom('');
		setDateTo('');
		setDateRange([]);
	};

	useEffect(() => {
		if (dateCleared) {
			return;
		}

		if (dateRange?.length) {
			const [from, to] = dateRange;

			setDateFrom(from);
			setDateTo(to);
		}
	}, [dateRange, dateCleared]);

	return (
		<div className={s.root}>
			<div className={s.left}>
				<button onClick={toggle}>{expanded ? '⬅️' : '➡️'}</button>
				<h1>Гант</h1>
				<input
					className={s.search}
					type="search"
					placeholder="поиск по названию"
					value={search || ''}
					onChange={(event) => setSearch(event.target.value)}
				/>
				<input className={s.field} type="date" onChange={updateFrom} value={dateFrom} />
				<input className={s.field} type="date" onChange={updateTo} value={dateTo} />
				<button
					className={s.clear}
					type="button"
					title="сбросить даты"
					onClick={clearDates}
				>❌</button>
				{/* · */}
				<select className={s.field} value={status} onChange={(event) => setStatus(event.target.value)}>
					<option value="">все статусы</option>
					{statuses.map((item) => (
						<option key={item} value={item}>{item}</option>
					))}
				</select>
				<select className={s.field} value={type} onChange={(event) => setType(event.target.value)}>
					<option value="">все типы</option>
					{types.map((item) => (
						<option key={item} value={item}>{item}</option>
					))}
				</select>
				<select className={s.field} value={startDate} onChange={(event) => setStartDate(event.target.value)}>
					<option value="">любая дата начала</option>
					<option value="has">есть дата начала</option>
					<option value="none">нет даты начала</option>
				</select>
				<select className={s.field} value={group} onChange={(event) => setGroup(event.target.value)}>
					<option value="">все участники</option>
					<option value="sync">рассинхрон назначенного</option>
					{Object.keys(groups || {}).map((key) => (
						<option key={key} value={key}>{key}</option>
					))}
				</select>
				·
				<button onClick={() => setModal('task')}>добавить задачу</button>
				{/* <button>Распределить неназначенные</button> */}
				{/* · */}
			</div>
			<div className={s.right}>
				<button onClick={() => setModal('legend')}>легенда</button>
				<button onClick={() => setDrawer(drawer === 'command' ? '' : 'command')}>команда</button>
				<button onClick={() => setDrawer(drawer === 'settings' ? '' : 'settings')}>⚙️</button>
			</div>
		</div>
	);
};
