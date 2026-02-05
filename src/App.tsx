import { useState, useEffect } from 'react';

import { fetchData } from './api';
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
				dateRange={data?.dateRange}
				toggle={toggle}
				setModal={setModal}
				setDrawer={setDrawer}
			/>
			<div className={s.content}>
				<Table
					expanded={expanded}
					dateRange={data?.dateRange}
					issues={data?.issues}
					updated={data?.updated}
					team={data?.team}
					editIssue={editIssue}
				/>
				{drawer && (
					<div className={s.drawer}>
						<div className={s.drawerBody}>
							<div className={s.drawerClose} onClick={() => setDrawer('')}>
								<span>&times;</span>
							</div>
							<div className={s.drawerContent}>
								{drawer === 'command' && <Team team={data?.team} />}
								{drawer === 'settings' && <Settings prefetchData={prefetchData} />}
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
