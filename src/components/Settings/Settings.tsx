import { useState, useEffect } from 'react';

import {
	updateSprintIssues,
	deleteIssues,
	refetchIssues,
	setList,
	setListJql,
	saveIssue,
	runRandomJql,
} from '../../api';
import { countWorkDays } from '../../utils';
import { List } from '../List';

import s from './Settings.module.scss';

interface ISettingsProps {
	data: any;
	onChange: () => void;
}

export const Settings = ({
	data,
	onChange,
}: ISettingsProps) => {
	// const [boardId, setBoardId] = useState('');
	const [loadingBoard, setLoadingBoard] = useState(false);
	const [refetchIssuesLoading, setRefetchIssuesLoading] = useState(false);
	const [updateIssuesByTarget, setUpdateIssuesByTarget] = useState(false);
	const [updatedTime, setUpdatedTime] = useState(86400000);
	const [weekends, setWeekends] = useState<string[]>([]);
	const [weekend, setWeekend] = useState('');
	const [delimiters, setDelimiters] = useState<string[]>([]);
	const [delimiter, setDelimiter] = useState('');
	const [randomJql, setRandomJql] = useState('');

	// const handleInputBoardId = (event: any) => {
	// 	setBoardId(event.target.value);
	// };

	const getBoard = () => {
		setLoadingBoard(true);
		updateSprintIssues()
			.then(onChange)
			.finally(() => setLoadingBoard(false));
	};

	const clearBoard = () => {
		if (prompt()) {
			deleteIssues().then(onChange);
		}
	}

	const doneIssues = data.issues
		.filter((issue: any) => ['done', 'закрыт', 'closed'].includes(issue?.jira?.statuses?.slice(-1)?.pop()?.to?.toLowerCase() || ''))
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

	const canSetupByTarget = data.issues
		.filter((issue: any) =>
			issue.jira.targetStart &&
			issue.jira.targetEnd// &&
			// !issue.base.startDate &&
			// !issue.base.duration
		);

	const setupByTarget = async () => {
		setUpdateIssuesByTarget(true);

		for (const issue of canSetupByTarget) {
			const nextData = {
				id: issue?.id,
				base: {
					summary: issue.base.summary,
					startDate: issue.jira.targetStart,
					duration: countWorkDays(issue.jira.targetStart, issue.jira.targetEnd, weekends),
					assignee: issue.jira.assignee,
				},
				jira: issue.jira || {},
			};

			await saveIssue(nextData);
		}

		setUpdateIssuesByTarget(false);

		onChange();
	};

	const removeAllInDone = () => {
		// TODO remove all issues with status done
		// dropAllInDone(doneIssues.join(','));
	};

	const updateExpired = () => {
		setRefetchIssuesLoading(true);
		refetchIssues({ keys: ussuesToUpdate })
			.then(onChange)
			.finally(() => setRefetchIssuesLoading(false));
	};

	const handleSelectUpdatedTime = (event: any) =>
		setUpdatedTime(Number(event.target.value));

	const handleChangeJQLParam = (key: string) => (values: string[]) => {
		setListJql({
			key,
			values,
		}).then(onChange);
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
		}).then(onChange);
	};

	const handleChangeDelimiter = (event: any) => {
		setDelimiter(event.target.value);
	};

	const addDelimiter = () => {
		if (delimiter) {
			setDelimiters((v) => v.concat(delimiter));
		}
	};

	const deleteDelimiter = (date: string) => () => {
		setDelimiters((v) => v.filter((item) => item !== date));
	};

	const saveDelimiters = () => {
		setList({
			key: 'delimiters',
			values: delimiters,
		}).then(onChange);
	};

	const deleteDoneIssues = () => {
		if (doneIssues?.length) {
			deleteIssues({ keys: doneIssues }).then(onChange);
		}
	};

	const handleRandomJql = (event: any) => {
		setRandomJql(event.target.value);
	};

	const getRandomJql = async () => {
		await runRandomJql(randomJql.replace(/\n/ig, ' '));
		onChange();
	};

	useEffect(() => {
		setWeekends(data.weekends);
		setDelimiters(data.delimiters);
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

			<textarea
				rows={3}
				cols={40}
				value={randomJql}
				onChange={handleRandomJql}
			></textarea>
			<button onClick={getRandomJql}>Запрос JQL</button>

			<br />

			<details>
				<br />
				<summary>Поля запроса JQL</summary>
				<h2>Проекты в jira</h2>
				<List
					list={data.jql.projects}
					onChange={handleChangeJQLParam('projects')}
				/>
				<h2>Спринты</h2>
				<List
					list={data.jql.sprints}
					onChange={handleChangeJQLParam('sprints')}
				/>
				<h2>Исключить типы задач</h2>
				<List
					list={data.jql.excludeTypes}
					onChange={handleChangeJQLParam('excludeTypes')}
				/>
				<h2>Исключить статусы</h2>
				<List
					list={data.jql.excludedStatuses}
					onChange={handleChangeJQLParam('excludedStatuses')}
				/>
				<h2>Компоненты задач</h2>
				<List
					list={data.jql.components}
					onChange={handleChangeJQLParam('components')}
				/>

			</details>

			<br />

			<button
				onClick={setupByTarget}
				disabled={canSetupByTarget.length === 0 || updateIssuesByTarget || loadingBoard}
			>
				Синхронизировать расстановку с гантом ({canSetupByTarget.length})
			</button>

			<br />

			<h2>Выходные дни</h2>
			<div className={s.row}>
				<input type="date" value={weekend} onChange={handleChangeWeekend} />
				<button onClick={addWeekend}>Добавить</button>
			</div>
			<div className={s.scrollable}>
				{weekends.map((weekend: string) => (
					<div key={weekend} className={s.item}>
						<span>{weekend}</span>
						<a href="#" onClick={deleteWeekend(weekend)}>&times;</a>
					</div>
				))}
			</div>
			<div className={s.controls}>
				<button onClick={saveWeekends}>Сохранить</button>
			</div>

			<h2>Разделители</h2>
			<div className={s.row}>
				<input type="date" value={delimiter} onChange={handleChangeDelimiter} />
				<button onClick={addDelimiter}>Добавить</button>
			</div>
			<div className={s.scrollable}>
				{delimiters.map((delimiter: string) => (
					<div key={delimiter} className={s.item}>
						<span>{delimiter}</span>
						<a href="#" onClick={deleteDelimiter(delimiter)}>&times;</a>
					</div>
				))}
			</div>
			<div className={s.controls}>
				<button onClick={saveDelimiters}>Сохранить</button>
			</div>
		</div>
	);
};
