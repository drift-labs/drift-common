import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const DrawTicket = (allProps: IconProps) => {
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
						d="M13.629 11.173l.71 1.23m3.55 6.149l.71 1.23m-2.84-4.92l.71 1.23M8.42 17.46a2.067 2.067 0 011.59-.198c.54.15 1 .51 1.283.999.283.489.363 1.068.224 1.61a2.067 2.067 0 01-.967 1.278l.71 1.23c.189.326.496.566.855.666.36.1.741.053 1.06-.132l9.643-5.567c.32-.184.551-.49.644-.852.093-.361.04-.747-.15-1.073l-.71-1.23a2.067 2.067 0 01-1.59.197c-.538-.15-1-.509-1.282-.998a2.152 2.152 0 01-.224-1.61c.14-.542.487-1.002.967-1.279l-.71-1.23a1.435 1.435 0 00-.856-.665c-.359-.1-.74-.053-1.06.131l-9.642 5.567c-.32.185-.551.491-.644.852-.093.361-.04.748.149 1.074l.71 1.23z"
						stroke="#77ACF2"
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M13.375 4.382a5.25 5.25 0 015.25 0l6.124 3.535a5.25 5.25 0 012.625 4.547v7.072c0 1.875-1 3.609-2.625 4.546l-6.124 3.536a5.25 5.25 0 01-5.25 0l-6.124-3.535a5.25 5.25 0 01-2.625-4.547v-7.072c0-1.876 1-3.609 2.625-4.547l6.124-3.535z"
						stroke="#B9D7FF"
						strokeWidth={1.5}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default DrawTicket;
