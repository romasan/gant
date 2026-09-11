import { useState, useEffect, useMemo } from 'react';

import { fetchData } from './api';
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
		prefetchData();
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
		</div>
	);
};
