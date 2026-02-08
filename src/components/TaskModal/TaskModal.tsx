import { useEffect, useState } from 'react';

import { fetchIssue, saveIssue, deleteIssue } from '../../api';
import {
	parseDurationToDays,
	countWorkDays,
	countDaysBetween,
} from '../../utils';

import s from './TaskModal.module.scss';

const parseNumber = (value: string) => {
	if (isNaN(Number(value))) {
		return null;
	}

	return Number(value.split('.')[0]);
}

interface IProps {
	issue?: any,
	projects: string[],
	team: string[],
	weekends: string[],
	onChange: () => void;
}

export const TaskModal = ({
	issue,
	projects,
	team,
	weekends,
	onChange,
}: IProps) => {
	const editMode = Boolean(issue);

	const [issueKey, setIssueKey] = useState('');
	const [project, setProject] = useState('');
	const [jiraData, setJiraData] = useState<any>({});
	const [summary, setSummary] = useState('');
	const [startDate, setStartDate] = useState('');
	const [duration, setDuration] = useState('');
	const [assignee, setAssignee] = useState('');

	const jiraStartDate = jiraData?.statuses?.find((item: any) => ['develop', 'in progress'].includes(item.to.toLowerCase()))?.date;

	const disabledSetIssue = !summary;

	const handleInputIssue = (event: any) => {
		const value = event.target.value;

		if (value === '' || parseNumber(value)) {
			setIssueKey(value.split('.')[0].replace(/\-+/ig, ''));
		}
	};

	const handleLoadIssue = async () => {
		const data = await fetchIssue(`${project}-${issueKey}`);

		setJiraData(data);
	};

	const handleUpdateIssue = async (event: any) => {
		event.preventDefault();
		const data = await fetchIssue(jiraData.key);

		setJiraData(data);
	};

	const handleSelectProject = (event: any) => {
		setProject(event.target.value);
	};

	const handleSelectMember = (event: any) => {
		setAssignee(event.target.value);
	};

	const fillWithJiraSummary = (event: any) => {
		event.preventDefault();
		setSummary(`${jiraData.key}: ${jiraData.summary}`);
	}

	const setIssue = () => {
		const nextData = {
			id: issue?.id,
			base: {
				summary,
				startDate,
				duration,
				assignee,
			},
			jira: jiraData || {},
		};

		saveIssue(nextData).then(onChange);
	};

	const dropIssue = () => {
		deleteIssue(issue.id).then(onChange);
	};

	const setDurationBetweenDates = (event: any) => {
		const value = countWorkDays(startDate, event.target.value, weekends);

		setDuration(String(value));
	}

	useEffect(() => {
		if (projects?.length) {
			setProject(projects[0]);
		}
	}, [projects]);

	useEffect(() => {
		if (issue) {
			setSummary(issue?.base?.summary || '');
			setStartDate(issue?.base?.startDate || '');
			setDuration(issue?.base?.duration || '');
			setAssignee(issue?.base?.assignee || '');
			setJiraData(issue?.jira || {});
		}
	}, [issue]);

	return (
		<div className={s.root}>
			<div className={s.title}>{editMode? 'Редактировать задачу' : 'Добавить задачу'}</div>
			<div className={s.row}>
				<input
					placeholder="Название"
					size={100}
					value={summary}
					onChange={(event: any) => setSummary(event.target.value)}
				/>
			</div>
			{jiraData.summary && (
				<div className={s.row}>
					<a href="#" onClick={fillWithJiraSummary}>⬆️</a>
					<a href="#" onClick={handleUpdateIssue}>🔄</a>
					{/* TODO use host from server data jira.host */}
					<a href={`https://jira.vk.team/browse/${jiraData.key}`} target="_blank">{jiraData.key}</a>
					<span>{jiraData.summary}</span>
				</div>
			)}
			{jiraData.status && (
				<div className={s.row}>Статус: {jiraData.status}</div>
			)}
			{jiraData.createdDate && (
				<div className={s.row}>Дата создания: {jiraData.createdDate} ({countDaysBetween(jiraData.createdDate, new Date())} д. назад)</div>
			)}
			{Boolean(jiraStartDate) && (
				<div className={s.row}>
					Дата начала работы: {jiraStartDate} ({countDaysBetween(jiraStartDate, new Date())} д. назад)
				</div>
			)}
			{!issue?.jira?.key && (
				<div className={s.row}>
					<select onChange={handleSelectProject}>
						{projects.map((key) => (
							<option key={key}>{key}</option>
						))}
					</select>
					<input placeholder="номер" value={issueKey} onChange={handleInputIssue}/>
					<button onClick={handleLoadIssue}>Загрузить</button>
				</div>
			)}
			<div className={s.row}>
				Предварительная дата начала работы:
				<input
					type="date"
					value={startDate}
					onChange={(event: any) => setStartDate(event.target.value)}
				/>
			</div>
			<div className={s.row}>
				Предварительная оценка:
				<input
					size={3}
					value={duration}
					onChange={(event: any) => setDuration(event.target.value)}
				/> д.
				{Boolean(startDate) && (
					<input
						type="date"
						onChange={setDurationBetweenDates}
					/>
				)}
			</div>
			{Boolean(jiraData?.timetracking) && (
				<div className={s.row}>
				Оценка: {jiraData?.timetracking} ({parseDurationToDays(jiraData?.timetracking || '')} д.)
			</div>
			)}
			{Boolean(team?.length) && (
				<div className={s.row}>
					Назначить:
					<select onChange={handleSelectMember} value={assignee}>
						<option value="">---</option>
						{team.map((key) => (
							<option key={key} value={key}>{key}</option>
						))}
					</select>
				</div>
			)}
			{jiraData?.assignee && (
				<div className={s.row}>Исполнитель: {jiraData.assignee}</div>
			)}
			{Boolean(jiraData?.statuses?.length) && (
				<details>
					<summary>История изменения статуса:</summary>
					{jiraData?.statuses.map((status) => (
						<div key={status.date}>
							{status.date};
							&nbsp;
							"{status.to}"
							{/* ? д. */}
						</div>
					))}
				</details>
			)}
			<div className={s.footer}>
				{editMode ? (
					<>
						<button onClick={dropIssue}>Удалить</button>
						<button disabled={disabledSetIssue} onClick={setIssue}>Сохранить</button>
					</>
				) : (
					<button disabled={disabledSetIssue} onClick={setIssue}>Добавить</button>
				)}
			</div>
			{/* <pre>{issue && JSON.stringify(issue, null, 2)}</pre> */}
		</div>
	);
};
