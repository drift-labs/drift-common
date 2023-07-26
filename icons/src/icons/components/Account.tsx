import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Account = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M5.933 4.667a2.067 2.067 0 114.134 0 2.067 2.067 0 01-4.134 0zM8 1.4a3.267 3.267 0 100 6.533A3.267 3.267 0 008 1.4zM3.267 13.333a3.4 3.4 0 013.4-3.4h2.666a3.4 3.4 0 013.4 3.4V14a.6.6 0 001.2 0v-.667a4.6 4.6 0 00-4.6-4.6H6.667a4.6 4.6 0 00-4.6 4.6V14a.6.6 0 101.2 0v-.667z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Account;
