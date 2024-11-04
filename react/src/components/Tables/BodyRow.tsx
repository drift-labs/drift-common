import { PropsWithChildren } from 'react';
import { twMerge } from 'tailwind-merge';
import { TableRowWrapper } from './TableRowWrapper';

export const BodyRow = ({
	children,
	className,
	isDataRow,
	...props
}: PropsWithChildren<{
	grid: string;
	className?: string;
	forceBottomBorder?: boolean;
	header?: boolean;
	lastColumnJustify?: string;
	isDataRow?: boolean;
	noBorder?: boolean;
	onClick?: (_event: MouseEvent) => void;
	lastChildNoBorder?: boolean;
	strongBottomBorder?: boolean;
}>): JSX.Element => {
	return (
		<TableRowWrapper
			{...props}
			noBorder={props.noBorder}
			className={twMerge(
				`bg-container-bg hover:bg-container-bg-hover`,
				className
			)}
			grid={props.grid}
			data-puppet-tag={isDataRow ? 'table_data_row' : undefined}
		>
			{children}
		</TableRowWrapper>
	);
};
