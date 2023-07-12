import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LP = (allProps: IconProps) => {
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
						d="M8.283 2.35a.4.4 0 00-.566 0L4.7 5.367a4.667 4.667 0 106.6 0L8.283 2.35zM7.646.535a.5.5 0 01.708 0l3.889 3.889a6 6 0 11-8.486 0l3.89-3.89zM8.3 11.986A.28.28 0 018 11.7V5.633a.28.28 0 01.3-.286 3.333 3.333 0 010 6.64z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LP;
