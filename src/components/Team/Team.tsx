import { useRef, useState, useEffect } from 'react';

import { setList } from '../../api';
import { List } from '../List';

import s from './Team.module.scss';
import { deepCopy } from '../../utils';

interface ITeam {
	team: string[];
	groups: any,
	onChange: () => void;
}

export const Team = ({
	team = [],
	groups,
	onChange,
}: ITeam) => {
	const [selectedGroup, setSelectedGroup] = useState('');
	const [groupMembers, setGroupMembers] = useState<string[]>([]);
	const [groupName, setGroupName] = useState('');
	const [groupsCopy, setGroupsCopy] = useState({});

	const inputGroupRef = useRef(null);

	const handleChangeTeam = (values: string[]) => {
		setList({
			key: 'team',
			values,
		}).then(onChange);
	};

	const handleSelectGroup = (event: any) => {
		const key = event.target.value;

		setSelectedGroup(key);
		setGroupMembers(groups[key]);
		setGroupName(key);
	};

	const handleCheckGroupMember = (event: any) => {
		setGroupMembers((members) => event.target.checked
			? members.concat(event.target.value)
			: members.filter((v: string) => v !== event.target.value)
		);
	};

	const handleInputGroupName = (event: any) => {
		setGroupName(event.target.value);
	};

	const addGroup = () => {
		setSelectedGroup('');
		setGroupMembers([]);
		setGroupName('');

		setTimeout(() => {
			(inputGroupRef.current as any)?.focus?.();
		}, 0);
	};

	const deleteGroup = () => {};

	const saveGroups = () => {
		console.log('==== saveGroups', {
			selectedGroup,
			groupMembers,
			groups,
			groupsCopy,
		});

		// delete groups[selectedGroup];

		// const next = {
		// 	...groups,
		// 	[groupName]: groupMembers,
		// };
	};

	useEffect(() => {
		if (groups) {
			setGroupsCopy(deepCopy(groups));

			const key = Object.keys(groups)[0];

			if (key) {
				setSelectedGroup(key);
				setGroupMembers(groups[key]);
				setGroupName(key);
			}
		}
	}, [groups, team]);

	return (
		<div className={s.root}>
			<h2>Список участников</h2>
			<List
				list={team}
				onChange={handleChangeTeam}
			/>

			{/* <h2>Группы</h2>
			{Object.keys(groups).length && (
				<select onChange={handleSelectGroup} value={selectedGroup}>
					{Object.keys(groups).map((key) => (
						<option key={key} value={key}>{key}</option>
					))}
				</select>
			)}
			<div className={s.row}>
				<input
					placeholder="Группа"
					value={groupName}
					onChange={handleInputGroupName}
				/>
				<button onClick={addGroup}>Добавить</button>
				<button onClick={deleteGroup}>Удалить</button>
			</div>
			{team.map((item: string) => (
				<label key={item}>
					<input
						ref={inputGroupRef}
						type="checkbox"
						value={item}
						checked={groupMembers.includes(item)}
						onChange={handleCheckGroupMember}
					/>
					{item}
				</label>
			))}
			<div className={s.controls}>
				<button onClick={saveGroups}>Сохранить</button>
			</div>

			<h2>Группа по умолчанию</h2>
			<select>
				<option>все</option>
				<option>все кроме лида</option>
			</select> */}
		</div>
	);
};
