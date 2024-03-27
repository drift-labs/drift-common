import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trade = (allProps: IconProps) => {
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
						d="M4.5 6.5v10h5v-10h-5zM4 5a1 1 0 00-1 1v11a1 1 0 001 1h6a1 1 0 001-1V6a1 1 0 00-1-1H4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7 2.25a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0V3A.75.75 0 017 2.25zM7 17.25a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3a.75.75 0 01.75-.75zM14.5 10.5v4h5v-4h-5zM14 9a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1v-5a1 1 0 00-1-1h-6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M17 2.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM17 14.75a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-5.5a.75.75 0 01.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trade;
