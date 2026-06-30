import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Drifter = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M11.203 3.05a1 1 0 011.594 0l1.528 2.016c.218.288.576.436.934.387l2.506-.345a1 1 0 011.126 1.127l-.344 2.507a1 1 0 00.386.933l2.016 1.528a1 1 0 010 1.594l-2.016 1.528a1.001 1.001 0 00-.386.934l.344 2.506a1 1 0 01-1.126 1.126l-2.506-.344a1.001 1.001 0 00-.934.386l-1.528 2.016a1 1 0 01-1.594 0l-1.528-2.016a1 1 0 00-.933-.386l-2.507.344a1 1 0 01-1.127-1.126l.345-2.506a1.001 1.001 0 00-.387-.934l-2.015-1.528a1 1 0 010-1.594l2.015-1.528a1 1 0 00.387-.933l-.345-2.507a1 1 0 011.127-1.127l2.507.345a1 1 0 00.933-.387l1.528-2.015zm5.352 6.445a.75.75 0 00-1.06-.05l-4.91 4.462-1.5-1.876a.75.75 0 00-1.171.938l2 2.5a.751.751 0 001.09.086l5.5-5a.75.75 0 00.05-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Drifter;
