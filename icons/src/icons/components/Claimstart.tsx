import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Claimstart = (allProps: IconProps) => {
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
						d="M8.889 3.25a.75.75 0 01.75.75v.85h4.722V4a.75.75 0 011.5 0v.85h1.583c1.294 0 2.306 1.072 2.306 2.35v11.2c0 1.278-1.012 2.35-2.306 2.35H6.556c-1.294 0-2.306-1.072-2.306-2.35V7.2c0-1.278 1.012-2.35 2.306-2.35h1.583V4a.75.75 0 01.75-.75zm-.75 3.1H6.556c-.426 0-.806.36-.806.85v2.45h12.5V7.2c0-.49-.38-.85-.806-.85h-1.583v.85a.75.75 0 01-1.5 0v-.85H9.64v.85a.75.75 0 01-1.5 0v-.85zm10.111 4.8H5.75v7.25c0 .49.38.85.806.85h10.888c.426 0 .806-.36.806-.85v-7.25zm-3.394 1.912a.75.75 0 01.015 1.06l-3.111 3.2a.75.75 0 01-1.075 0l-1.556-1.6a.75.75 0 111.075-1.045l1.018 1.047 2.574-2.647a.75.75 0 011.06-.015z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Claimstart;
