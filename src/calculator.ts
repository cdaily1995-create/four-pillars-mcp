import {
  EightChar,
  SixtyCycle,
  SolarTime,
  YinYang,
  type EarthBranch,
  type HeavenStem,
} from 'tyme4ts';
import { trueSolarTime, tzOffsetMinutes } from 'ziwei-time';

export const ENGINE_VERSION = 'four-pillars-mcp/0.1.0';
export const RULES_VERSION = 'ziping-four-pillars/0.1.0';

export interface FourPillarsInput {
  date: string;
  time: string;
  timezone: string;
  longitude: number;
  latitude?: number;
}

interface DateParts {
  date: string;
  time: string;
}

export interface FourPillar {
  key: 'year' | 'month' | 'day' | 'hour';
  name: string;
  stem: { name: string; element: string; yinYang: 'yin' | 'yang' };
  branch: { name: string; element: string; yinYang: 'yin' | 'yang' };
}

export interface FourPillarsResult {
  engineVersion: string;
  rulesVersion: string;
  input: FourPillarsInput;
  method: {
    yearMonth: 'astronomical_jieqi_at_instant';
    dayHour: 'local_apparent_solar';
    dayBoundary: 'zi_start_next_day';
  };
  normalizedTime: {
    civil: DateParts;
    trueSolar: DateParts;
    utcIso: string;
    correction: {
      totalMinutes: number;
      longitudeMinutes: number;
      equationOfTimeMinutes: number;
      dstMinutes: number;
      dayShift: number;
    };
    solarTerm: { name: string; isJie: boolean; distanceMinutes: number };
    warnings: string[];
  };
  pillars: FourPillar[];
  dayMaster: { name: string; element: string; yinYang: 'yin' | 'yang' };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

function parseDateTime(date: string, time: string) {
  const dateMatch = DATE_RE.exec(date);
  const timeMatch = TIME_RE.exec(time);
  if (!dateMatch || !timeMatch)
    throw new Error('date must use YYYY-MM-DD and time must use HH:mm');
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error('date or time is invalid');
  }
  return { year, month, day, hour, minute };
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function partsFromUtcOffset(utcMs: number, offsetMinutes: number): DateParts {
  const value = new Date(utcMs + offsetMinutes * 60_000);
  return {
    date: `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`,
    time: `${pad2(value.getUTCHours())}:${pad2(value.getUTCMinutes())}`,
  };
}

function calendarDayShift(fromDate: string, toDate: string) {
  const from = parseDateTime(fromDate, '00:00');
  const to = parseDateTime(toDate, '00:00');
  return Math.round(
    (Date.UTC(to.year, to.month - 1, to.day) -
      Date.UTC(from.year, from.month - 1, from.day)) /
      86_400_000
  );
}

function standardOffsetMinutes(utcMs: number, timezone: string) {
  const year = new Date(utcMs).getUTCFullYear();
  const candidates = [
    tzOffsetMinutes(Date.UTC(year, 0, 1), timezone),
    tzOffsetMinutes(Date.UTC(year, 6, 1), timezone),
  ].filter((value): value is number => value !== null);
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function solarTime(value: DateParts) {
  const p = parseDateTime(value.date, value.time);
  return SolarTime.fromYmdHms(p.year, p.month, p.day, p.hour, p.minute, 0);
}

function dayPillarReference(value: DateParts): DateParts {
  const { hour } = parseDateTime(value.date, value.time);
  if (hour < 23) return value;
  const p = parseDateTime(value.date, value.time);
  const next = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return {
    date: `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`,
    time: value.time,
  };
}

function solarTermBoundary(value: DateParts) {
  const reference = solarTime(value);
  const previous = reference.getTerm();
  const next = previous.next(1);
  const previousTime = previous.getJulianDay().getSolarTime();
  const nextTime = next.getJulianDay().getSolarTime();
  const previousMinutes = Math.abs(reference.subtract(previousTime)) / 60;
  const nextMinutes = Math.abs(nextTime.subtract(reference)) / 60;
  const term = previousMinutes <= nextMinutes ? previous : next;
  return {
    name: term.getName(),
    isJie: term.isJie(),
    distanceMinutes: Math.round(Math.min(previousMinutes, nextMinutes)),
  };
}

function stemFact(stem: HeavenStem, dayMaster?: HeavenStem) {
  return {
    name: stem.getName(),
    element: stem.getElement().getName(),
    yinYang: (stem.getYinYang() === YinYang.YANG ? 'yang' : 'yin') as
      'yin' | 'yang',
    ...(dayMaster ? { tenGod: dayMaster.getTenStar(stem).getName() } : {}),
  };
}

function branchFact(branch: EarthBranch) {
  return {
    name: branch.getName(),
    element: branch.getElement().getName(),
    yinYang: (branch.getYinYang() === YinYang.YANG ? 'yang' : 'yin') as
      'yin' | 'yang',
  };
}

function pillarFact(
  key: FourPillar['key'],
  pillar: SixtyCycle,
  dayMaster: HeavenStem
): FourPillar {
  return {
    key,
    name: pillar.getName(),
    stem: stemFact(pillar.getHeavenStem(), dayMaster),
    branch: branchFact(pillar.getEarthBranch()),
  };
}

function hourCycleFor(day: SixtyCycle, local: SolarTime) {
  const branch = local.getLunarHour().getSixtyCycle().getEarthBranch();
  return SixtyCycle.fromIndex(
    day.getHeavenStem().getIndex() * 12 + branch.getIndex()
  );
}

export function calculateFourPillars(
  input: FourPillarsInput
): FourPillarsResult {
  parseDateTime(input.date, input.time);
  if (
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  )
    throw new Error('longitude must be between -180 and 180');
  if (
    input.latitude !== undefined &&
    (!Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90)
  ) {
    throw new Error('latitude must be between -90 and 90');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: input.timezone }).format();
  } catch {
    throw new Error('timezone must be a valid IANA time zone');
  }

  const parts = parseDateTime(input.date, input.time);
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute
  );
  const localOffset = tzOffsetMinutes(wallClockAsUtc, input.timezone);
  if (localOffset === null)
    throw new Error('timezone offset could not be resolved');
  const utcMs = wallClockAsUtc - localOffset * 60_000;
  const refinedOffset = tzOffsetMinutes(utcMs, input.timezone);
  if (refinedOffset === null)
    throw new Error('historical timezone could not be resolved');
  const solar = trueSolarTime({
    date: input.date,
    time: input.time,
    timezone: input.timezone,
    longitude: input.longitude,
    latitude: input.latitude,
    equationOfTime: true,
  });
  const totalMinutes = input.longitude * 4 - refinedOffset + solar.eotMinutes;
  const trueSolar = partsFromUtcOffset(
    wallClockAsUtc + Math.round(totalMinutes) * 60_000,
    0
  );
  const standardOffset = standardOffsetMinutes(utcMs, input.timezone);
  const dayShift = calendarDayShift(input.date, trueSolar.date);
  const warnings = dayShift ? ['true_solar_date_shift'] : [];

  const normalizedTime = {
    civil: { date: input.date, time: input.time },
    trueSolar,
    utcIso: new Date(utcMs).toISOString(),
    correction: {
      totalMinutes: Math.round(totalMinutes),
      longitudeMinutes: Math.round(input.longitude * 4 - refinedOffset),
      equationOfTimeMinutes: solar.eotMinutes,
      dstMinutes: standardOffset === null ? 0 : refinedOffset - standardOffset,
      dayShift,
    },
    solarTerm: solarTermBoundary({
      date: trueSolar.date,
      time: trueSolar.time,
    }),
    warnings,
  };

  const instantReference = solarTime({
    date: normalizedTime.civil.date,
    time: normalizedTime.civil.time,
  });
  const localReference = solarTime(normalizedTime.trueSolar);
  const dayDate = dayPillarReference(normalizedTime.trueSolar);
  const dayReference = solarTime({ ...dayDate, time: '12:00' });
  const instantChart = instantReference.getLunarHour().getEightChar();
  const dayChart = dayReference.getLunarHour().getEightChar();
  const day = dayChart.getDay();
  const chart = new EightChar(
    instantChart.getYear(),
    instantChart.getMonth(),
    day,
    hourCycleFor(day, localReference)
  );
  const dayMaster = chart.getDay().getHeavenStem();

  return {
    engineVersion: ENGINE_VERSION,
    rulesVersion: RULES_VERSION,
    input,
    method: {
      yearMonth: 'astronomical_jieqi_at_instant',
      dayHour: 'local_apparent_solar',
      dayBoundary: 'zi_start_next_day',
    },
    normalizedTime,
    pillars: [
      pillarFact('year', chart.getYear(), dayMaster),
      pillarFact('month', chart.getMonth(), dayMaster),
      pillarFact('day', chart.getDay(), dayMaster),
      pillarFact('hour', chart.getHour(), dayMaster),
    ],
    dayMaster: stemFact(dayMaster),
  };
}
