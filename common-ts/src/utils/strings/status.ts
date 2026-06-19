export const LAST_ORDER_STATUS_LABELS = {
	open: 'Open',
	filled: 'Filled',
	partial_fill: 'Partially Filled',
	cancelled: 'Canceled',
	partial_fill_cancelled: 'Partially Filled & Canceled',
	expired: 'Expired',
	trigger: 'Triggered',
} as const;
export type LastOrderStatus = keyof typeof LAST_ORDER_STATUS_LABELS;
export type LastOrderStatusLabel =
	(typeof LAST_ORDER_STATUS_LABELS)[LastOrderStatus];

export function lastOrderStatusToNormalEng(
	status: string
): LastOrderStatusLabel | string {
	return LAST_ORDER_STATUS_LABELS[status as LastOrderStatus] ?? status;
}
