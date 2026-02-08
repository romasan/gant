import { useState, useEffect } from 'react';

import {
	updateSprintIssues,
	deleteIssues,
	refetchIssues,
	setList,
	setListJql,
} from '../../api';
import { List } from '../List';

import s from './Settings.module.scss';

interface ISettingsProps {
	data: any;
	prefetchData: () => void;
}

export const Settings = ({
	data,
	prefetchData,
}: ISettingsProps) => {
	// const [boardId, setBoardId] = useState('');
	const [loadingBoard, setLoadingBoard] = useState(false);
	const [refetchIssuesLoading, setRefetchIssuesLoading] = useState(false);
	const [updatedTime, setUpdatedTime] = useState(86400000);
	const [weekends, setWeekends] = useState<string[]>([]);
	const [weekend, setWeekend] = useState('');

	// const handleInputBoardId = (event: any) => {
	// 	setBoardId(event.target.value);
	// };

	const getBoard = () => {
		setLoadingBoard(true);
		updateSprintIssues()
			.then(prefetchData)
			.finally(() => setLoadingBoard(false));
	};

	const clearBoard = () => {
		if (prompt()) {
			deleteIssues().then(prefetchData);
		}
	}

	const doneIssues = data.issues
		.filter((issue: any) => ['done', 'закрыт', 'closed'].includes(issue.jira?.statuses?.slice(-1)?.pop()?.to?.toLowerCase()))
		.map((issue: any) => issue?.jira?.key)
		.filter(Boolean);

	const noProgressIssues = data.issues
		.filter((issue: any) => {
			const status = issue.jira?.statuses?.slice(-1)?.pop()?.to?.toLowerCase() || issue.jira?.status?.toLowerCase();

			return !status || ['new', 'devready', 'новый', 'открытый'].includes(status);
		})
		.map((issue: any) => issue?.jira?.key)
		.filter(Boolean);

	const ussuesToUpdate = data.issues
		.filter((issue: any) => !issue?.updated || (Date.now() - new Date(issue?.updated).getTime()) >= updatedTime)
		.map((issue: any) => issue?.jira?.key)
		.filter(Boolean);

	const issuesWithJira = data.issues
		.map((issue: any) => issue?.jira?.key)
		.filter(Boolean);

	const removeAllInDone = () => {
		// TODO remove all issues with status done
		// dropAllInDone(doneIssues.join(','));
	};

	const updateExpired = () => {
		setRefetchIssuesLoading(true);
		refetchIssues({ keys: ussuesToUpdate })
			.then(prefetchData)
			.finally(() => setRefetchIssuesLoading(false));
	};

	const handleSelectUpdatedTime = (event: any) =>
		setUpdatedTime(Number(event.target.value));

	const handleChangeTeam = (key: string) => (values: string[]) => {
		setListJql({
			key,
			values,
		}).then(prefetchData);
	};

	const handleChangeWeekend = (event: any) => {
		setWeekend(event.target.value);
	};

	const addWeekend = () => {
		if (weekend) {
			setWeekends((v) => v.concat(weekend));
		}
	};

	const deleteWeekend = (date: string) => () => {
		setWeekends((v) => v.filter((item) => item !== date));
	};

	const saveWeekends = () => {
		setList({
			key: 'weekends',
			values: weekends,
		}).then(prefetchData);
	};

	const deleteDoneIssues = () => {
		if (doneIssues?.length) {
			deleteIssues({ keys: doneIssues }).then(prefetchData);
		}
	};

	useEffect(() => {
		setWeekends(data.weekends);
	}, [data])

	return (
		<div className={s.root}>
			{/* <div>
				<input type="date" />
				-
				<input type="date" />
			</div>
			<div>
				<input size={30} placeholder="ID доски" onChange={handleInputBoardId} />
			</div> */}
			<h2>
				Управление задачами
			</h2>
			<div className={s.row}>
				<button onClick={getBoard} disabled={loadingBoard}>Обновить задачи из спринта</button>
			</div>
			{/* <div className={s.row}>
				<button onClick={removeAllInDone}>Убрать готовые задачи ({doneIssues.length})</button>
			</div> */}
			<div className={s.row}>
				Всего задач на доске: {data.issues.length}
			</div>
			<div className={s.row}>
				Задачи слинкованные с Jira: {issuesWithJira.length}
			</div>
			<div className={s.row}>
				Задачи не в работе: {noProgressIssues.length}
			</div>
			<div className={s.row}>
				<button
					onClick={deleteDoneIssues}
					disabled={!doneIssues.length}
				>
					Удалить задачи в готово ({doneIssues.length})
				</button>
			</div>
			<div className={s.row}>
				<button
					onClick={updateExpired}
					disabled={refetchIssuesLoading}
				>
					Обновить задачи ({ussuesToUpdate.length})
				</button>
				<select onChange={handleSelectUpdatedTime} value={updatedTime}>
					<option value={86400000}>1 день</option>
					<option value={360000}>1 час</option>
				</select>
			</div>
			<div className={s.row}>
				<button onClick={clearBoard} className={s.danger}>Удалить все сохранённые задачи</button>
			</div>
			<h2>Проекты в jira</h2>
			<List
				list={data.jql.projects}
				onChange={handleChangeTeam('projects')}
			/>
			<h2>Исключить типы задач</h2>
			<List
				list={data.jql.excludeTypes}
				onChange={handleChangeTeam('excludeTypes')}
			/>
			<h2>Исключить статусы</h2>
			<List
				list={data.jql.excludedStatuses}
				onChange={handleChangeTeam('excludedStatuses')}
			/>
			<h2>Компоненты задач</h2>
			<List
				list={data.jql.components}
				onChange={handleChangeTeam('components')}
			/>
			<h2>Выходные дни</h2>
			<div className={s.row}>
				<input type="date" value={weekend} onChange={handleChangeWeekend} />
				<button onClick={addWeekend}>Добавить</button>
			</div>
			{weekends.map((weekend: string) => (
				<div key={weekend} className={s.item}>
					<span>{weekend}</span>
					<a href="#" onClick={deleteWeekend(weekend)}>&times;</a>
				</div>
			))}
			<div className={s.controls}>
				<button onClick={saveWeekends}>Сохранить</button>
			</div>
		</div>
	);
};
