export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to a time string "HH:MM".
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateHourlySlots(date: string, startTime: string, endTime: string, slotDuration: number = 60): Array<{ date: string; startTime: string; endTime: string }> {
  const slots = [];
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  for (let t = startMins; t < endMins; t += slotDuration) {
    const slotStart = minutesToTime(t);
    // Make sure the last slot does not exceed the overall end time
    const slotEnd = minutesToTime(Math.min(t + slotDuration, endMins));
    slots.push({ date, startTime: slotStart, endTime: slotEnd });
  }
  return slots;
}