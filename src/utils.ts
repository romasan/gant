export const parseDurationToDays = (value: string) => {
	const weekMatch = value.match(/(\d+)w/i);
	const dayMatch = value.match(/(\d+)d/i);
	const hourMatch = value.match(/(\d+)h/i);

	const weeks = weekMatch ? parseInt(weekMatch[1]) : 0;
	const days = dayMatch ? parseInt(dayMatch[1]) : 0;
	const hours = hourMatch ? parseInt(hourMatch[1]) : 0;

	const totalDays = weeks * 5 + days;

	const hoursInWorkDays = Math.ceil(hours / 8);

	return totalDays + hoursInWorkDays;
};

export const isWeekend = (dateTime: Date, weekends: string[]) => {
	const key = dateTime.toISOString().split('T')[0];

	return [0, 6].includes(dateTime.getDay()) || weekends.includes(key);
};

export const expandWeekend = (startDate: string | Date, duration: number, weekends: string[]) => {
	let current = new Date(startDate);
	let workDays = 0;

	const days = [];

	while (workDays < Number(duration)) {
		days.push(isWeekend(current, weekends) ? 'w' : 'd');
		workDays = days.filter((v) => v === 'd').length;
		current.setDate(current.getDate() + 1);
	}

	return days.length;
};

const pluralize = (num: number, forms: [string, string, string]): string => ({
	'one': forms[0],
	'two': forms[1],
	'few': forms[1],
	'many': forms[2],
	'zero': forms[2],
	'other': forms[2],
}[new Intl.PluralRules('ru-RU').select(num)]);

const oneDay = 1000 * 60 * 60 * 24;
export const countDaysBetween = (startDate: string | Date, endDate: string | Date): number =>
	Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / oneDay);


export const countWorkDays = (startDate: string | Date, endDate: string | Date, weekends: string[]): number => {
	let workDays = 0;
	const start = new Date(startDate);
	const end = new Date(endDate);

	for (
		let date = new Date(start);
		date <= end;
		date.setDate(date.getDate() + 1)
	) {
		if (!isWeekend(date, weekends)) {
			workDays++;
		}
	}

	return workDays;
};

export const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));
