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
						d="M13.375 4.382a5.25 5.25 0 015.25 0l6.124 3.535a5.25 5.25 0 012.625 4.547v7.072c0 1.875-1 3.609-2.625 4.546l-6.124 3.536a5.25 5.25 0 01-5.25 0l-6.124-3.535a5.25 5.25 0 01-2.625-4.547v-7.072c0-1.876 1-3.609 2.625-4.547l6.124-3.535z"
						stroke="#D4D4D8"
						strokeWidth={1.5}
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
