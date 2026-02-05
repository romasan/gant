import { useState } from 'react';

import { updateSprintIssues, deleteIssues } from '../../api';

import s from './Settings.module.scss';

interface ISettingsProps {
	prefetchData: () => void;
}

export const Settings = ({
	prefetchData,
}: ISettingsProps) => {
	// const [boardId, setBoardId] = useState('');
	const [loadingBoard, setLoadingBoard] = useState(false);

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

	return (
		<div>
			{/* <div>
				<input type="date" />
				-
				<input type="date" />
			</div>
			<div>
				<button>Запросить все заски в работе за этот период TODO</button>
			</div>
			<div>
				<button>Обновить статус всех записанных ранее задач TODO</button>
			</div>
			<div>
				<input size={30} placeholder="Префикс проекта"/>
			</div>
			<div>
				<button>Добавить проект TODO</button>
			</div>
			<div>
				<input size={30} placeholder="ID доски" onChange={handleInputBoardId} />
			</div> */}
			{/* <button>Изменить номер доски проекта TODO</button> */}
			<div className={s.row}>
				<button onClick={getBoard} disabled={loadingBoard}>Обновить задачи из спринта</button>
			</div>
			<div className={s.row}>
				<button onClick={clearBoard} className={s.danger}>Удалить все сохранённые задачи</button>
			</div>
		</div>
	);
};
