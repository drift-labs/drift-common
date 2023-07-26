import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LP = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M2.782 9.068c0-1.482.699-2.796 1.754-4.058.765-.916 1.66-1.742 2.549-2.562.308-.284.616-.568.917-.855.302.287.61.57.918.855.888.82 1.783 1.646 2.549 2.562 1.055 1.262 1.754 2.576 1.754 4.058a5.22 5.22 0 11-10.441 0z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.424}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8.246 12.092c0 .119.097.216.215.207a3.007 3.007 0 000-5.998.204.204 0 00-.215.207v5.584z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LP;
