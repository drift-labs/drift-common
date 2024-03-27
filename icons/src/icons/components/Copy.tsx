import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Copy = (allProps: IconProps) => {
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
						d="M5.6 4.75a.855.855 0 00-.85.85v8c0 .466.384.85.85.85h.59a.75.75 0 010 1.5H5.6a2.355 2.355 0 01-2.35-2.35v-8A2.355 2.355 0 015.6 3.25h8a2.355 2.355 0 012.35 2.35v.643a.75.75 0 01-1.5 0V5.6a.855.855 0 00-.85-.85h-8zm4.8 4.8a.85.85 0 00-.85.85v8c0 .47.38.85.85.85h8c.47 0 .85-.38.85-.85v-8a.85.85 0 00-.85-.85h-8zm-2.35.85a2.35 2.35 0 012.35-2.35h8a2.35 2.35 0 012.35 2.35v8a2.35 2.35 0 01-2.35 2.35h-8a2.35 2.35 0 01-2.35-2.35v-8z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Copy;
