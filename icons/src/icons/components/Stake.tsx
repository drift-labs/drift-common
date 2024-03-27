import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Stake = (allProps: IconProps) => {
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
						d="M4.5 4.5v13h15v-13h-15zM4.4 3A1.4 1.4 0 003 4.4v13.2A1.4 1.4 0 004.4 19h15.2a1.4 1.4 0 001.4-1.4V4.4A1.4 1.4 0 0019.6 3H4.4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 18.25a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1a.75.75 0 01.75-.75zM7 7.75a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5A.75.75 0 017 7.75zM16 18.25a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1a.75.75 0 01.75-.75zM15 12.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 1.5a3 3 0 100-6 3 3 0 000 6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Stake;
