import { useState, useEffect } from 'react';
import { saveIssue } from '../../../../api';
import { UNKNOWN } from '../../../../constants';

import s from './Menu.module.scss';

interface IMenuProps {
	menu: any;
	menuRef?: any;
	team: string[],
	host: string;
	editIssue: (value: any) => void;
	onChange: () => void;
}

export const Menu = ({
	menu,
	menuRef,
	team,
	host,
	editIssue,
	onChange,
}: IMenuProps) => {
	const [menuScreen, setMenuScreen] = useState('default');
	const [startDate, setStartDate] = useState('');
	const [assignee, setAssignee] = useState('');

	const handleMenuEdit = () => {
		editIssue(menu.issue);
	};

	const handleMenuMove = () => {
		setTimeout(() => setMenuScreen('move'), 0);
	};

	const handleMenuAssignee = () => {
		setTimeout(() => setMenuScreen('assignee'), 0);
	};

	const handleMenuGoToJira = () => {
		const link = `${host}/browse/${menu.issue?.jira?.key}`;

		window.open(link);
	};

	const calcMenuStyles = () => {
		const isClickOnBottom = menu.y > (document.body.offsetHeight - 200);
		const isClickOnRight = menu.x > (document.body.offsetWidth - 200);

		const styles: any = {};

		if (isClickOnRight) {
			styles.right = document.body.offsetWidth - menu.x;
		} else {
			styles.left = menu.x
		}

		if (isClickOnBottom) {
			styles.bottom = document.body.offsetHeight - menu.y;
		} else {
			styles.top = menu.y - 50;
		}

		return styles;
	};

	const handleChangeStartDate = async (event: any) => {
		const nextData = {
			id: menu.issue?.id,
			base: {
				summary: menu.issue?.base?.summary,
				startDate: event.target.value,
				duration: menu.issue?.base?.duration,
				assignee: menu.issue?.base?.assignee,
			},
			jira: menu.issue?.jira || {},
		};

		await saveIssue(nextData);

		onChange();

		setStartDate(event.target.value);
	};

	const moveStartDate = async (add = 1) => {
		let date = new Date(startDate);

		date.setDate(date.getDate() + add);

		const nextData = {
			id: menu.issue?.id,
			base: {
				summary: menu.issue?.base?.summary,
				startDate: date.toISOString().split('T')[0],
				duration: menu.issue?.base?.duration,
				assignee: menu.issue?.base?.assignee,
			},
			jira: menu.issue?.jira || {},
		};

		await saveIssue(nextData);

		onChange();

		setStartDate(date.toISOString().split('T')[0]);
	};

	const handleSelectMember = async (event: any) => {
		const value = event.target.value;

		if (!value) {
			return;
		}

		const nextData = {
			id: menu.issue?.id,
			base: {
				summary: menu.issue?.base?.summary,
				startDate: menu.issue?.base?.startDate,
				duration: menu.issue?.base?.duration,
				assignee: value,
			},
			jira: menu.issue?.jira || {},
		};

		await saveIssue(nextData);

		onChange();

		setAssignee(value);
	};

	useEffect(() => {
		setStartDate(menu?.issue?.base?.startDate || '');
		setAssignee(menu?.issue?.base?.assignee || '');
	}, [menu]);

	return (
		<div
			className={s.menu}
			style={calcMenuStyles()}
			ref={menuRef}
		>
			{menuScreen === 'default' && (
				<>
					<div className={s.menuItem} onClick={handleMenuEdit}>редактировать</div>
					<div className={s.menuItem} onClick={handleMenuMove}>сдвинуть</div>
					<div className={s.menuItem} onClick={handleMenuAssignee}>назначить на другого</div>
					<div className={s.menuItem} onClick={handleMenuGoToJira}>перейти</div>
				</>
			)}
			{menuScreen === 'move' && (
				<>
					<div className={s.header}>Изменить дату начала</div>
					<div className={s.menuMove}>
						<button className={s.left} onClick={() => moveStartDate(-1)}>➔</button>
						<input
							type="date"
							value={startDate || ''}
							onChange={handleChangeStartDate}
						/>
						<button onClick={() => moveStartDate(1)}>➔</button>
					</div>
				</>
			)}
			{menuScreen === 'assignee' && (
				<>
					<div className={s.header}>Выбрать исполнителя</div>
					<div className={s.menuAssignee}>
						<select onChange={handleSelectMember} value={assignee}>
							<option value="">---</option>
							{team.map((key) => (
								<option key={key} value={key}>{key}</option>
							))}
							<option value={UNKNOWN}>Не назначена</option>
						</select>
					</div>
				</>
			)}
		</div>
	);
};
