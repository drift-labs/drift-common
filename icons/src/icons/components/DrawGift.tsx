import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const DrawGift = (allProps: IconProps) => {
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
						fill="#FFD9AB"
					/>
					<path
						d="M16 12.89V23m0-10.11c-.281-1.16-.766-2.151-1.39-2.845-.624-.694-1.36-1.058-2.11-1.045a1.944 1.944 0 100 3.89m3.5 0c.281-1.16.766-2.151 1.39-2.845.624-.694 1.36-1.058 2.11-1.045a1.944 1.944 0 110 3.89M21.444 16v5.445A1.555 1.555 0 0119.89 23H12.11a1.556 1.556 0 01-1.555-1.555V16m-.778-3.11h12.444c.43 0 .778.347.778.777v1.555c0 .43-.348.778-.778.778H9.778A.778.778 0 019 15.222v-1.555c0-.43.348-.778.778-.778z"
						stroke="#FFB459"
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
export default DrawGift;
