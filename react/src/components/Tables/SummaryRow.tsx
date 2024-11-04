import { PropsWithChildren } from 'react';
import { TableRowWrapper } from './TableRowWrapper';
import { twMerge } from 'tailwind-merge';

export const SummaryRow = ({
	children,
	className,
	...props
}: PropsWithChildren<{
	grid: string;
	className?: string;
	header?: boolean;
}>): JSX.Element => {
	return (
		<TableRowWrapper
			{...props}
			className={twMerge(`bg-container-bg`, className)}
			grid={props.grid}
			noBorder
			topBorder
		>
			{children}
		</TableRowWrapper>
	);
};
