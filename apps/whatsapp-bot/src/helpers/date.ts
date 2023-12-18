import { DateTime } from "luxon";

export const formatDate = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);
  return luxonDate.toFormat("dd LLL yyyy");

}

export const getWeeksBetweenDates = ({ startDate, endDate }: { startDate: Date, endDate: Date }) => {
  const startDateTime = DateTime.fromJSDate(startDate);
  const endDateTime = DateTime.fromJSDate(endDate);  
  const diffInWeeks = endDateTime.diff(startDateTime, 'weeks').weeks;
  return Math.round(diffInWeeks);
}
