import { ScheduleType } from '@backend-template/types';

export async function scheduleHandler(
  scheduleType: ScheduleType
): Promise<void> {
  switch (scheduleType) {
    case 'SCHEDULE_ONE':
      console.log('verification reminder event');
      break;
    default:
      console.error('no handler for event');
  }
}
