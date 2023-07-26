import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const EyeHide = (allProps: IconProps) => {
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
						d="M10.25 11.75c-6 2-8.5-3.75-8.5-3.75s.5-1.75 3-3.25m4-1c3.5.5 5.5 4.25 5.5 4.25s-.5 1.25-1.5 2.25l-4-6.5z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M8.625 9.083a1.25 1.25 0 01-1.429-2.041L8 8l.625 1.083z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M3.75 1.75l8.5 12.5"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default EyeHide;
