import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const DrawPrize = (allProps: IconProps) => {
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
						d="M18.25 5.031a4.5 4.5 0 00-4.5 0L7.626 8.567a4.5 4.5 0 00-2.25 3.897v7.072a4.5 4.5 0 002.25 3.897l6.124 3.536a4.5 4.5 0 004.5 0l6.124-3.536a4.5 4.5 0 002.25-3.897v-7.072a4.5 4.5 0 00-2.25-3.897L18.25 5.031zM19 3.732a6 6 0 00-6 0L6.876 7.268a6 6 0 00-3 5.196v7.072a6 6 0 003 5.196L13 28.268a6 6 0 006 0l6.124-3.536a6 6 0 003-5.196v-7.072a6 6 0 00-3-5.196L19 3.732z"
						fill="#FFDEAD"
					/>
					<path
						d="M18.21 8.485c1.32.82.593 4.374-1.622 7.936m1.622-7.936c-1.32-.82-4.185 1.403-6.4 4.965-2.215 3.563-2.941 7.116-1.622 7.936m8.022-12.9l3.822 2.376c.634.394.819 1.452.515 2.94-.304 1.488-1.073 3.285-2.136 4.996m-3.823-2.377c-2.215 3.563-5.08 5.786-6.4 4.965m6.4-4.965l3.823 2.377m-10.223 2.588l3.823 2.377c.633.394 1.664.092 2.864-.839 1.2-.93 2.472-2.415 3.536-4.126m-6.115.67l3.775 2.347m.236-8.797l3.774 2.347"
						stroke="#FFCF52"
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
export default DrawPrize;
