import { PropsWithChildren } from 'react';
import { BodyCellWrapper } from './BodyCellWrapper';

export const BodyCell = ({
	children,
	className,
	onClick,
	dataPuppetTag,
	flexCol,
	alignCenter,
	alignRight,
	innerClassName,
}: PropsWithChildren<{
	className?: string;
	innerClassName?: string;
	onClick?: () => void;
	dataPuppetTag?: string;
	flexCol?: boolean;
	alignCenter?: boolean;
	alignRight?: boolean;
}>) => {
	return (
		<BodyCellWrapper
			className={className}
			onClick={onClick}
			dataPuppetTag={dataPuppetTag}
			flexCol={flexCol}
			alignCenter={alignCenter}
			alignRight={alignRight}
			innerClassName={innerClassName}
		>
			{children}
		</BodyCellWrapper>
	);
};
