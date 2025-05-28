'use client';

import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { FloatingPortal } from '@floating-ui/react';

export type FloatingPopoverProps = {
	setFloating: (node: HTMLDivElement) => void;
	floatingStyles: React.CSSProperties;
	getFloatingProps: () => Record<string, any>;
};

type PopoverWrapperProps = {
	portalId?: string;
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	noBorder?: boolean;
	useTargetWidth?: boolean;
	ref: ((node: HTMLElement | null) => void) &
		((node: HTMLElement | null) => void); // id of target element
};

const PopoverWrapper = (props: PopoverWrapperProps) => {
	const [targetWidth, setTargetWidth] = React.useState<number | null>(null);

	useEffect(() => {
		if (props.useTargetWidth) {
			if (!props.portalId) {
				console.warn(
					"PopoverWrapper: 'id' prop is required when 'useTargetWidth' is true"
				);
				return;
			}

			const targetElement = document.getElementById(props.portalId);
			if (targetElement) {
				setTargetWidth(targetElement.offsetWidth);
			}
		}
	}, [props.portalId, props.useTargetWidth]);

	return props.useTargetWidth && !targetWidth ? null : (
		<FloatingPortal id={`${props.portalId}_portal`}>
			<div
				ref={props.ref}
				className={twMerge(
					`bg-container-bg rounded overflow-auto align-middle text-text-emphasis z-50`,
					!props.noBorder && 'border border-container-border',
					props.className
				)}
				style={{
					width: targetWidth ? `${targetWidth}px` : undefined,
					...props.style,
				}}
			>
				{props.children}
			</div>
		</FloatingPortal>
	);
};

PopoverWrapper.displayName = 'PopoverWrapper';

export default PopoverWrapper;
