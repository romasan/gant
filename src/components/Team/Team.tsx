import s from './Team.module.scss';

export const Team = ({ team = [] }) => {
	return (
		<div className={s.root}>
			<div>Список участников:</div>
			{team?.map((item) => (
				<div key={item} className={s.member}>
					<a href="#">{item}</a>
					<a href="#">&times;</a>
				</div>
			))}

			<div>Группы участников:</div>
			<div>
				<a href="#">все</a>
			</div>
			{/* <div>
				<a href="#">все кроме лида</a>
				<a href="#">&times;</a>
			</div>
			<div>
				<a href="#">великолепная четвёрка</a>
				<a href="#">&times;</a>
			</div>
			<div>
				<a href="#">вк видео</a>
				<a href="#">&times;</a>
			</div> */}

			<div>Группа по умолчанию:</div>
			<select>
				<option>все</option>
				<option>все кроме лида</option>
			</select>
		</div>
	);
};
