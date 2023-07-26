import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LiqHalf = (allProps: IconProps) => {
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
					<circle
						cx={8}
						cy={8}
						r={6}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.8}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 3.734a4.267 4.267 0 000 8.533V3.734z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LiqHalf;
