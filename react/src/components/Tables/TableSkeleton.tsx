import { twMerge } from 'tailwind-merge';
import CentreFillScroller from '../Utils/CentreFillScroller';
import { BodyRowWrapper } from './BodyRowWrapper';
import { PropsWithChildren, type JSX } from 'react';
import { InlineLoadingBar } from '../Loaders/InlineLoadingBar';

export const TableSkeleton = (
	props: PropsWithChildren<{
		top: JSX.Element | null;
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
		loading?: boolean;
		setIsScrollable?: (_isScrollable: boolean) => void;
		overflowAuto?: boolean;
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
			middle={
				!props.loading ? (
					<BodyRowWrapper noBg>{props.middle}</BodyRowWrapper>
				) : (
					<div className="w-full flex items-center justify-center my-8">
						<InlineLoadingBar />
					</div>
				)
			}
			bottom={props.bottom}
			fillSpace={props.fillSpace}
			autoHeight={props.autoHeight}
			innerClassName={props.innerClassName}
			overflowAuto={props.overflowAuto}
			setIsScrollable={props.setIsScrollable}
		/>
	);
};
