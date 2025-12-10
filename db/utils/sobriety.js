const { DateTime } = require("luxon");

/**
 * Calculate the author's days sober at a specific moment in time.
 * @param {Date|string|null} sobrietyStartAt
 * @param {Date|string} [now=new Date()]
 * @param {string} [timezone="UTC"]
 * @returns {number|null} Rounded days sober or null when unavailable/invalid.
 */
const calculateDaysSober = (sobrietyStartAt, now = new Date(), timezone = "UTC") => {
  if (!sobrietyStartAt) return null;

  const startDt = DateTime.fromJSDate(new Date(sobrietyStartAt)).setZone(timezone);
  const nowDt = DateTime.fromJSDate(new Date(now)).setZone(timezone);

  if (!startDt.isValid || !nowDt.isValid) return null;

  const diffDays = nowDt.diff(startDt, "days").days;
  if (diffDays < 0) return null;

  return Math.round(diffDays);
};

module.exports = { calculateDaysSober };
