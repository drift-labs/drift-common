import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const No = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.75 12a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.53 7.47a.75.75 0 00-1.06 1.06L10.94 12l-3.47 3.47a.75.75 0 101.06 1.06L12 13.06l3.47 3.47a.75.75 0 101.06-1.06L13.06 12l3.47-3.47a.75.75 0 00-1.06-1.06L12 10.94 8.53 7.47z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default No;
