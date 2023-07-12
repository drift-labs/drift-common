import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hide = (allProps: IconProps) => {
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
						d="M2 2l12 12M7.056 7.058a1.334 1.334 0 001.885 1.887"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.333}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M6.242 3.577A6.31 6.31 0 018 3.333c2.667 0 4.889 1.556 6.667 4.667-.519.907-1.075 1.683-1.669 2.325m-1.427 1.241A6.253 6.253 0 018 12.666c-2.667 0-4.889-1.555-6.667-4.666.913-1.597 1.942-2.783 3.088-3.56"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hide;
