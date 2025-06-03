'use client';

import React, { useEffect, useRef } from 'react';
import { twMerge, twJoin } from 'tailwind-merge';

/**
 * Utility component to fill some space with top, middle and bottom content, while allowing the middle content to be larger than the space and become scrollable
 * @param param0
 * @returns
 */
const CentreFillScroller = ({
	top,
	middle,
	bottom,
	hideScroll,
	outerClassName,
	innerClassName,
	fillSpace,
	autoHeight,
	overflowAuto,
	useCustomMiddleWrapper,
	setIsScrollable,
}: {
	top: React.ReactNode;
	middle: React.ReactNode;
	bottom?: React.ReactNode;
	hideScroll?: boolean;
	outerClassName?: string;
	innerClassName?: string;
	fillSpace?: boolean;
	autoHeight?: boolean;
	overflowAuto?: boolean;
	useCustomMiddleWrapper?: boolean;
	setIsScrollable?: (isScrollable: boolean) => void;
}) => {
	const scrollableRef = useRef<HTMLDivElement>(null);

	/**
	 * Sets the isScrollable state to true if the middle content is scrollable.
	 * This is typically used to add padding to the right of the header row of a table to account for the scrollbar.
	 */
	useEffect(() => {
		if (setIsScrollable) {
			const checkScrollability = () => {
				if (scrollableRef.current) {
					const isScrollable =
						scrollableRef.current.scrollHeight >
						scrollableRef.current.clientHeight;
					setIsScrollable(isScrollable);
				}
			};

			// Initial check
			checkScrollability();

			// Set up ResizeObserver to check on size changes
			const resizeObserver = new ResizeObserver(checkScrollability);
			if (scrollableRef.current) {
				resizeObserver.observe(scrollableRef.current);
			}

			// Clean up
			return () => {
				if (scrollableRef.current) {
					resizeObserver.unobserve(scrollableRef.current);
				}
				resizeObserver.disconnect();
			};
		}
	}, [setIsScrollable]);

	return (
		<div
			className={twMerge(
				`flex flex-col w-full`,
				!autoHeight && 'h-full',
				outerClassName
			)}
		>
			{top}

			<div
				className={twMerge(
					`relative flex-grow h-full w-full overflow-x-hidden`,
					overflowAuto ? 'overflow-y-auto' : 'overflow-y-scroll',
					hideScroll ? 'hidden-scroll' : 'thin-scroll',
					innerClassName
				)}
				ref={scrollableRef}
			>
				{useCustomMiddleWrapper ? (
					<>{middle}</>
				) : (
					<div className={twJoin(`w-full h-full`, !fillSpace && 'md:absolute')}>
						{middle}
					</div>
				)}
			</div>

			{bottom}
		</div>
	);
};

export default CentreFillScroller;
