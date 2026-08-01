export function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parseDate(key) {
  const [year, month, day] = String(key).split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function weekdaysForCount(count) {
  if (count <= 5) return [1, 2, 3, 4, 5];
  if (count === 6) return [1, 2, 3, 4, 5, 6];
  return [0, 1, 2, 3, 4, 5, 6];
}

export function monthContext(workWeekdays, extraDaysOff = 0, reference = new Date()) {
  const weekdays = new Set(workWeekdays);
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const dates = [];
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month, day, 12);
    if (weekdays.has(date.getDay())) dates.push(dateKey(date));
  }
  const plannedDates = dates.slice(0, Math.max(0, dates.length - Math.max(0, extraDaysOff)));
  const today = dateKey(reference);
  const elapsedDates = plannedDates.filter(key => key <= today);
  const remainingDates = plannedDates.filter(key => key > today);
  return { key: monthKey(reference), plannedDates, elapsedDates, remainingDates, workdays: plannedDates.length, elapsedWorkdays: elapsedDates.length, remainingWorkdays: remainingDates.length };
}

export function weekRange(reference = new Date()) {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}
