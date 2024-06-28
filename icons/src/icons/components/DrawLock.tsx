import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const DrawLock = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 32 32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M24.374 8.567L18.25 5.031a4.5 4.5 0 00-4.5 0L7.626 8.567a4.5 4.5 0 00-2.25 3.897v7.072a4.5 4.5 0 002.25 3.897l6.124 3.536a4.5 4.5 0 004.5 0l6.124-3.536a4.5 4.5 0 002.25-3.897v-7.072a4.5 4.5 0 00-2.25-3.897zM19 3.732a6 6 0 00-6 0L6.876 7.268a6 6 0 00-3 5.196v7.072a6 6 0 003 5.196L13 28.268a6 6 0 006 0l6.124-3.536a6 6 0 003-5.196v-7.072a6 6 0 00-3-5.196L19 3.732z"
						fill="#D4D4D8"
					/>
					<path
						d="M12.667 15.3v-2.8c0-.928.35-1.819.976-2.475A3.255 3.255 0 0116 9c.884 0 1.732.369 2.357 1.025a3.59 3.59 0 01.976 2.475v2.8m-8 0h9.334c.736 0 1.333.627 1.333 1.4v4.9c0 .773-.597 1.4-1.333 1.4h-9.334C10.597 23 10 22.373 10 21.6v-4.9c0-.773.597-1.4 1.333-1.4z"
						stroke="#D4D4D8"
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
export default DrawLock;
