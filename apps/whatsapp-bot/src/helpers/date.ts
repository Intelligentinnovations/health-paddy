import { DateTime } from "luxon";

export const formatDate = (date: Date) => {
  const luxonDate = DateTime.fromJSDate(date);
  return luxonDate.toFormat("dd LLL yyyy");

}
