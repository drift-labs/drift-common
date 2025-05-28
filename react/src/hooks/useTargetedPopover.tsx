'use client';

import {
	useFloating,
	useClick,
	useDismiss,
	useRole,
	useInteractions,
	UseFloatingOptions,
	offset,
	autoPlacement,
	shift,
	flip,
	Placement,
	autoUpdate,
} from '@floating-ui/react';
import { useState } from 'react';

/**
 * This is a utility hook that abstracts the logic for handling popovers that are triggered by a specific target element.
 *
 * The return object contains the following properties:
 * - refs: The refs object that includes the `refs.setReference` function that should be passed to the target element, and `refs.setFloating` that should be passed to the floating element.
 * - getReferenceProps: The props object that should be spread on the target element.
 * - floatingStyles: The styles object that should be passed to the floating element.
 * - getFloatingProps: The props object that should be spread on the floating element.
 * - setIsPopoverOpen: A function that can be used to open or close the popover.
 * - isPopoverOpen: A boolean that indicates whether the popover is open or closed.
 *
 * The popover component itself can be wrapped in a `<PopoverWrapper />` component to provide a consistent look and feel.
 *
 * Floating UI Docs: https://floating-ui.com/docs/
 */
export const useTargetedPopover = (
	floatingHookProps?: Partial<UseFloatingOptions>,
	options?: {
		/**
		 * An array of popup IDs that should be ignored when dismissing the popover. (e.g. nested popovers)
		 */
		nestedPopoverIds?: string[];
		/**
		 * Disables the auto-placement logic.
		 */
		disableAutoPlacement?: boolean;
		/**
		 * Instead of using auto-placement logic, it will flip the popover to the opposite side if it doesn't fit
		 */
		useFlip?: boolean;
		/**
		 * Determines the margin between the reference element and the popover.
		 */
		offset?: number;
		/**
		 * Disables the normal dismiss behavior (e.g. clicking outside the popup).
		 */
		disabledDismiss?: boolean;
		allowedPlacements?: Placement[];
		placement?: Placement;
	}
) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const offsetToUse = options?.offset ?? 8;

	const middlewares = [offset(offsetToUse), shift()];
	if (options?.useFlip) {
		middlewares.push(flip());
	}
	if (!options?.disableAutoPlacement && !options?.useFlip) {
		middlewares.push(
			autoPlacement({
				allowedPlacements: options?.allowedPlacements ?? [
					'bottom',
					'top',
					'left',
					'right',
				],
			})
		);
	}

	const { refs, floatingStyles, context } = useFloating({
		open: isPopoverOpen,
		onOpenChange: setIsPopoverOpen,
		placement: options?.placement || 'left',
		middleware: middlewares,
		whileElementsMounted: autoUpdate,
		...floatingHookProps,
	});

	const click = useClick(context);
	const dismiss = useDismiss(context, {
		enabled: !options?.disabledDismiss,
		outsidePress: (event: MouseEvent) => {
			if (!options?.nestedPopoverIds) return true;

			const target = event.target as HTMLElement;

			return !options.nestedPopoverIds.some((id) => {
				return document.getElementById(`${id}_portal`)?.contains(target);
			});
		},
	});
	const role = useRole(context);

	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
		role,
	]);

	return {
		refs,
		floatingStyles,
		getReferenceProps,
		getFloatingProps,
		setIsPopoverOpen,
		isPopoverOpen,
	};
};
