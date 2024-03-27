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
						d="M13.375 4.382a5.25 5.25 0 015.25 0l6.124 3.535a5.25 5.25 0 012.625 4.547v7.072c0 1.875-1 3.609-2.625 4.546l-6.124 3.536a5.25 5.25 0 01-5.25 0l-6.124-3.535a5.25 5.25 0 01-2.625-4.547v-7.072c0-1.876 1-3.609 2.625-4.547l6.124-3.535z"
						stroke="#FFD9AB"
						strokeWidth={1.5}
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
