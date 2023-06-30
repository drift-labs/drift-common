import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Edit = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M11.66 2.145a.933.933 0 00-1.32 0L2.647 9.838a.933.933 0 00-.255.477l-.549 2.744a.933.933 0 001.098 1.098l2.744-.549a.934.934 0 00.477-.255l7.693-7.693a.933.933 0 000-1.32L11.66 2.145zM10.05 4.13l.95-.95L12.818 5l-.842.842-1.925-1.71zm-.85.85L3.554 10.63l-.455 2.273 2.273-.455 5.755-5.755L9.2 4.982z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Edit;
