import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Help = (allProps: IconProps) => {
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
						d="M8 11.333v.007M2 8a6 6 0 1012 0A6 6 0 002 8z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M8 9a1 1 0 01.667-1 1.733 1.733 0 10-2-2.667"
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
export default Help;
