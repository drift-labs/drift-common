import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PriorityFee = (allProps: IconProps) => {
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
						d="M2.667 9.333a5.333 5.333 0 0110.667 0"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinejoin="round"
					/>
					<path
						d="M6.667 10a1.333 1.333 0 012.667 0"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.333}
						strokeLinejoin="round"
					/>
					<path
						d="M8.667 8.666l1.334-2m3.333 2.667V10a.667.667 0 01-.667.666H3.334A.666.666 0 012.667 10v-.667"
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
export default PriorityFee;
