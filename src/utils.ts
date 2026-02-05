export const parseDurationToDays = (value: string) => {
  const weekMatch = value.match(/(\d+)w/i);
  const dayMatch = value.match(/(\d+)d/i);
  const hourMatch = value.match(/(\d+)h/i);
  
  const weeks = weekMatch ? parseInt(weekMatch[1]) : 0;
  const days = dayMatch ? parseInt(dayMatch[1]) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  
  const totalDays = weeks * 5 + days;
  
  const hoursInWorkDays = hours > 0 ? Math.ceil(hours / 8) : 0;
  
  return totalDays + hoursInWorkDays;
};

export const isDayOff = (dateTime: Date) => [0, 6].includes(dateTime.getDay());

export const expandDayoff = (startDate: string | Date, duration: number) => {
  let current = new Date(startDate);
  let workDays = 0;
  let daysPassed = 0;

  while (workDays < duration) {
    current.setDate(current.getDate() + 1);
    daysPassed++;

    if (![0, 6].includes(current.getDay())) {
      workDays++;
    }
  }

  return daysPassed;
};

export const countWorkDays = (startDate: string | Date, endDate: string | Date): number => {
  let workDays = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    if (!isDayOff(date)) {
      workDays++;
    }
  }

  return workDays;
};