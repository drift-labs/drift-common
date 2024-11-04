import { twMerge } from 'tailwind-merge';
import CentreFillScroller from '../Utils/CentreFillScroller';
import { BodyRowWrapper } from './BodyRowWrapper';
import { PropsWithChildren } from 'react';

export const TableSkeleton = (
	props: PropsWithChildren<{
		top: JSX.Element;
		middle: JSX.Element;
		bottom?: JSX.Element;
		hideHeadersOnMobile?: boolean;
		isMobile?: boolean;
		noBorder?: boolean;
		noBg?: boolean;
		notRounded?: boolean;
		fillSpace?: boolean;
		className?: string;
		autoHeight?: boolean;
		innerClassName?: string;
		setIsScrollable?: (_isScrollable: boolean) => void;
	}>
) => {
	return (
		<CentreFillScroller
			outerClassName={twMerge(
				`overflow-hidden text-text-emphasis`,
				props.noBorder ? 'border-0' : 'border border-container-border',
				!props.notRounded && 'rounded-lg',
				props.className
			)}
			top={props.hideHeadersOnMobile && props.isMobile ? null : props.top}
			middle={<BodyRowWrapper noBg>{props.middle}</BodyRowWrapper>}
			bottom={props.bottom}
			fillSpace={props.fillSpace}
			autoHeight={props.autoHeight}
			innerClassName={props.innerClassName}
			overflowAuto
			setIsScrollable={props.setIsScrollable}
		/>
	);
};
