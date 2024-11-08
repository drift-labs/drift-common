import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { HistoricalTokenPriceDuration } from '../constants';

dayjs.extend(isSameOrAfter);

export const getDateTicks = (
	firstDateMs: number,
	lastDateMs: number,
	interval: number,
	unit: dayjs.ManipulateType
) => {
	let lastDate = dayjs(lastDateMs);
	const firstDate = dayjs(firstDateMs);
	const ticks: number[] = [];

	while (lastDate.isSameOrAfter(firstDate)) {
		ticks.push(lastDate.valueOf());
		lastDate = lastDate.subtract(interval, unit);
	}

	return ticks.reverse();
};

export const getTooltipDate = (
	ts: number,
	{
		isRelativeToToday = false,
		dateWithTime = true,
	}: {
		isRelativeToToday?: boolean;
		dateWithTime?: boolean;
	} = {
		isRelativeToToday: false,
		dateWithTime: true,
	}
) => {
	if (isRelativeToToday) {
		const isToday = dayjs(ts).isSame(dayjs(), 'date');
		const isYesterday = dayjs(ts).isSame(dayjs().subtract(1, 'day'), 'date');
		const isTomorrow = dayjs(ts).isSame(dayjs().add(1, 'day'), 'date');

		if (isToday || isYesterday || isTomorrow) {
			return dayjs(ts).format(
				`h:mm A [${isToday ? 'Today' : isYesterday ? 'Yesterday' : 'Tomorrow'}]`
			);
		}
	}

	return dayjs(ts).format(`[Date:]${dateWithTime ? ' h:mm A' : ''} DD/MM/YYYY`);
};

/**
 * Get custom x axis ticks based on duration
 *
 * ONE_DAY: every 2 hours
 * ONE_WEEK: every 1 day
 * ONE_MONTH: every 2 days
 */
export const getDurationBasedXAxisTicks = (
	firstDateMs: number,
	lastDateMs: number,
	duration: HistoricalTokenPriceDuration
): number[] => {
	if (duration === HistoricalTokenPriceDuration.ONE_DAY) {
		// find the closest even hour that has past lastDateTs e.g. if lastDateTs represents 13:05, then we want 12:00
		let lastDateHour = dayjs(lastDateMs).hour();
		const isEvenHour = lastDateHour % 2 === 0;
		if (!isEvenHour) {
			lastDateHour -= 1;
		}

		const formattedLastDateMs = dayjs(lastDateMs)
			.hour(lastDateHour)
			.minute(0)
			.valueOf();

		return getDateTicks(firstDateMs, formattedLastDateMs, 2, 'hour');
	} else if (duration === HistoricalTokenPriceDuration.ONE_WEEK) {
		// find start of day
		const formattedLastDateMs = dayjs(lastDateMs).hour(0).minute(0).valueOf();

		return getDateTicks(firstDateMs, formattedLastDateMs, 1, 'day');
	} else if (duration === HistoricalTokenPriceDuration.ONE_MONTH) {
		// find start of day
		const formattedLastDateMs = dayjs(lastDateMs).hour(0).minute(0).valueOf();

		return getDateTicks(firstDateMs, formattedLastDateMs, 2, 'day');
	}

	return [];
};
