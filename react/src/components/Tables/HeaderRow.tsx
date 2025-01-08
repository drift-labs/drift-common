import { PropsWithChildren, type JSX } from 'react';
import { twMerge } from 'tailwind-merge';
import { TableRowWrapper } from './TableRowWrapper';

export const HeaderRow = ({
	children,
	className,
	...props
}: PropsWithChildren<{
	grid: string;
	className?: string;
	forceBottomBorder?: boolean;
	header?: boolean;
	lastColumnJustify?: string;
	id?: string;
	/**
	 * Adds padding to the right of the table to account for scrollbar in the table.
	 */
	addScrollPadding?: boolean;
}>): JSX.Element => {
	return (
		<TableRowWrapper
			{...props}
			className={twMerge(
				`bg-main-bg`,
				props.addScrollPadding && 'pr-2',
				className
			)}
			grid={props.grid}
		>
			{children}
		</TableRowWrapper>
	);
};
