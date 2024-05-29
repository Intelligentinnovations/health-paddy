import { DateTime } from 'luxon';

export const formatDate = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);
  return luxonDate.toFormat("dd LLL yyyy");

}

export const getDiffBetweenDates = ({ startDate, endDate, timePeriod }: { startDate: Date, endDate: Date, timePeriod: 'years' |'weeks' }) => {
  const startDateTime = DateTime.fromJSDate(startDate);
  const endDateTime = DateTime.fromJSDate(endDate);
  const diff = endDateTime.diff(startDateTime, timePeriod)[timePeriod]
  return Math.round(diff);
}

export const parseDateOfBirth =  (dobString: string) => {
  const dobDateTime = DateTime.fromFormat(dobString, 'dd/MM/yyyy');
  if (!dobDateTime.isValid) {
    return 'Invalid date format';
  }
  return dobDateTime.toFormat('dd/MM/yyyy')
};
