import { useState, useEffect, useMemo, useRef } from 'react';

import { fetchData, updateSprintIssuesStream } from './api';
import { getIssueStatus } from './components/Table/utils';
import {
	Header,
	Table,
	TaskModal,
	Team,
	Settings,
	LegendModal,
} from './components';

import s from './App.module.scss';

export const App = () => {
	const [data, setData] = useState<any>({ loading: true });
	const [expanded, setExpanded] = useState(true);
	const [modal, setModal] = useState('');
	const [drawer, setDrawer] = useState('');
	const [selected, setSelected] = useState<any>(null);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('');
	const [type, setType] = useState('');
	const [startDate, setStartDate] = useState('');
	const [group, setGroup] = useState('');
	const [dateRange, setDateRange] = useState<string[]>([]);

	const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const autoUpdateRef = useRef(false);

	// 1 час — порог «устаревших» данных для автообновления при открытии
	const ONE_HOUR = 60 * 60 * 1000;

	const showToast = (
		message: string,
		type: 'info' | 'success' | 'error' = 'info',
		autoHide = true,
	) => {
		setToast({ message, type });

		if (toastTimerRef.current) {
			clearTimeout(toastTimerRef.current);
			toastTimerRef.current = null;
		}

		if (autoHide) {
			toastTimerRef.current = setTimeout(() => setToast(null), 4000);
		}
	};

	const startBoardUpdate = () => {
		showToast('Обновляется список задач…', 'info', false);

		updateSprintIssuesStream(
			() => {},
			() => {
				prefetchData();
				showToast('Список задач обновлён', 'success');
			},
			() => {
				prefetchData();
				showToast('Не удалось обновить список задач', 'error');
			},
		);
	};

	// Видимый диапазон: выбранный в шапке, иначе из db
	const range = dateRange.length === 2 ? dateRange : (data?.dateRange || []);

	const statuses = useMemo(() => Array.from(
		new Set((data?.issues || []).map((issue: any) => getIssueStatus(issue)).filter(Boolean))
	).sort((a: any, b: any) => a.localeCompare(b)), [data]);

	const types = useMemo(() => Array.from(
		new Set((data?.issues || []).map((issue: any) => issue?.jira?.type).filter(Boolean))
	).sort((a: any, b: any) => a.localeCompare(b)), [data]);

	const toggle = () => {
		setExpanded((v) => !v);
	};

	const editIssue = (issue: any) => {
		setSelected(issue);
		setModal('task');
	};

	// const onEditTask = (data) => {
	// 	setSelectedTask(data);
	// 	setModal('task');
	// };

	const prefetchData = () => {
		fetchData().then(setData);
	};

	const onSetIssue = () => {
		setSelected(null);
		prefetchData();
		setModal('');
	}

	useEffect(() => {
		fetchData().then((result) => {
			setData(result);

			// Автообновление при открытии: если последняя синхронизация была больше часа назад
			if (autoUpdateRef.current) {
				return;
			}

			const updated = result?.updated;

			if (updated && (Date.now() - new Date(updated).getTime()) > ONE_HOUR) {
				autoUpdateRef.current = true;
				startBoardUpdate();
			}
		});
	}, []);

	useEffect(() => {
		if (!modal) {
			setSelected(null);
		}
	}, [modal]);

	if (data.loading) {
		return (
			<div className={s.loading}>
				<span>ща всё будет</span>
			</div>
		);
	}

	return (
		<div className={s.root}>
			<Header
				expanded={expanded}
				drawer={drawer}
				dateRange={range}
				search={search}
				status={status}
				statuses={statuses as string[]}
				type={type}
				types={types as string[]}
				startDate={startDate}
				group={group}
				groups={data?.groups}
				toggle={toggle}
				setModal={setModal}
				setDrawer={setDrawer}
				setSearch={setSearch}
				setStatus={setStatus}
				setType={setType}
				setStartDate={setStartDate}
				setGroup={setGroup}
				setDateRange={setDateRange}
			/>
			<div className={s.content}>
				<Table
					expanded={expanded}
					dateRange={range}
					filterDateRange={dateRange}
					issues={data?.issues}
					updated={data?.updated}
					team={data?.team}
					search={search}
					status={status}
					type={type}
					startDate={startDate}
					group={group}
					groups={data?.groups}
					weekends={data?.weekends}
					delimiters={data?.delimiters}
					host={data.host}
					editIssue={editIssue}
					onChange={prefetchData}
				/>
				{drawer && (
					<div className={s.drawer}>
						<div className={s.drawerBody}>
							<div className={s.drawerClose} onClick={() => setDrawer('')}>
								<span>&times;</span>
							</div>
							<div className={s.drawerContent}>
								{drawer === 'command' && (
									<Team
										team={data?.team}
										groups={data?.groups}
										onChange={prefetchData}
									/>
								)}
								{drawer === 'settings' && (
									<Settings
										data={data}
										onChange={prefetchData}
									/>
								)}
							</div>
						</div>
					</div>
				)}
				{modal && (
					<div className={s.modalWrapper}>
						<div className={s.modalWindow}>
							<div className={s.modalClose} onClick={() => setModal('')}>&times;</div>
							<div className={s.modalContent}>
								{modal === 'task' && (
									<TaskModal
										projects={data.projects}
										issue={selected}
										team={data?.team}
										weekends={data?.weekends}
										host={data.host}
										onChange={onSetIssue}
									/>
								)}
								{modal === 'legend' && <LegendModal />}
							</div>
						</div>
					</div>
				)}
			</div>
			{toast && (
				<div className={`${s.toast} ${s[toast.type]}`}>
					{toast.message}
				</div>
			)}
		</div>
	);
};
