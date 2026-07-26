const { isWithinWorkingHours } = require('../../../src/agents/runtime/workingHoursPolicy');

describe('working hours policy', () => {
  it('uses the configured timezone and supports overnight schedules', () => {
    const agent = {
      workingHoursEnabled: true,
      workingHoursTimezone: 'Africa/Cairo',
      workingHours: {
        monday: { enabled: true, start: '22:00', end: '06:00' }
      }
    };

    expect(isWithinWorkingHours(agent, new Date('2026-07-27T21:00:00Z'))).toBe(true);
    expect(isWithinWorkingHours(agent, new Date('2026-07-27T12:00:00Z'))).toBe(false);
  });

  it('fails closed for invalid timezones and schedules', () => {
    expect(isWithinWorkingHours({
      workingHoursEnabled: true,
      workingHoursTimezone: 'invalid',
      workingHours: {}
    })).toBe(false);
  });
});
