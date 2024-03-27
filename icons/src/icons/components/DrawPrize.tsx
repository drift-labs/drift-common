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
						d="M13.375 4.382a5.25 5.25 0 015.25 0l6.124 3.535a5.25 5.25 0 012.625 4.547v7.072c0 1.875-1 3.609-2.625 4.546l-6.124 3.536a5.25 5.25 0 01-5.25 0l-6.124-3.535a5.25 5.25 0 01-2.625-4.547v-7.072c0-1.876 1-3.609 2.625-4.547l6.124-3.535z"
						stroke="#FFDEAD"
						strokeWidth={1.5}
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
