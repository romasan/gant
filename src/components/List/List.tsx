import { useRef, useState, useEffect } from 'react';

import s from './List.module.scss';

interface IList {
	list: string[];
	onChange: (value: string[]) => void;
}

export const List = ({
	list,
	onChange,
}: IList) => {
	const [values, setValues] = useState<string[]>([]);
	const [selected, setSelected] = useState(-1);
	const [selectedValue, setSelectedValue] = useState('');
	const inputRef = useRef(null);

	const add = () => {
		setValues((v) => v.filter(Boolean).concat(''));
		setSelected(values.length);
	};

	const changeItem = (event: any) => {
		setSelectedValue(event.target.value || '');
	};

	const handleKeyUp = (event: any) => {
		if (event.keyCode === 13) {
			setValues((a) => a.map((v, i) => i === selected ? selectedValue : v).filter(Boolean));
			setSelected(-1);
		}

		if (event.keyCode === 27) {
			setSelected(-1);
			setValues((a) => a.filter(Boolean));
		}
	};

	const deleteItem = (index: number) => () => setValues((a) =>
		a.filter((_, i) => i !== index)
	);

	const select = (index: number) => (event: any) => {
		event.preventDefault();
		setSelected(index);
	};

	useEffect(() => {
		if (list.length) {
			setValues(list);
		}
	}, [list]);

	useEffect(() => {
		if (selected >= 0) {
			setSelectedValue(values[selected] || '');
			setTimeout(() => {
				(inputRef.current as any)?.focus?.();
			}, 0);
		}
	}, [selected, values]);

	return (
		<div className={s.root}>
			{values?.map((item, index) => (
				<div key={`item-${index}`} className={s.row}>
					{selected === index
						? (
							<input
								ref={inputRef}
								value={selectedValue}
								onChange={changeItem}
								onKeyUp={handleKeyUp}
							/>
						)
						: <a href="#" onClick={select(index)}>{item}</a>
					}
					<a href="#" onClick={deleteItem(index)}>&times;</a>
				</div>
			))}

			<div className={s.footer}>
				<button onClick={add}>Добавить</button>
				<button onClick={() => onChange(values.filter(Boolean))}>Сохранить</button>
			</div>
		</div>
	);
};
