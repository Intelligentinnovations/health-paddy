import { DateTime } from 'luxon';

export const formatDate = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);
  return luxonDate.toFormat("dd LLL yyyy");

}

export const getDiffBetweenDates = ({ startDate, endDate, timePeriod }: { startDate: Date, endDate: Date, timePeriod: 'years' |'weeks' }) => {
  const startDateTime = DateTime.fromJSDate(new Date(startDate));
  const endDateTime = DateTime.fromJSDate(endDate);
  console.log({startDateTime, endDateTime})
  const diff = endDateTime.diff(startDateTime, timePeriod)[timePeriod]
  return Math.round(diff);
}

export const parseDateOfBirth =  (dobString: string) => {
  const dobDateTime = DateTime.fromFormat(dobString, 'dd/MM/yyyy');
  if (!dobDateTime.isValid) {
    return 'Invalid date format';
  }
  return dobDateTime.toFormat('yyyy/MM/dd')
};
