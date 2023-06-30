import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Stats = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 1.917a.75.75 0 01.75.75v10.666a.75.75 0 01-1.5 0V2.667a.75.75 0 01.75-.75zm4.25 3a.75.75 0 01.75.75v7.666a.75.75 0 01-1.5 0V5.666a.75.75 0 01.75-.75zM4.5 8.334a.75.75 0 10-1.5 0v5a.75.75 0 001.5 0v-5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Stats;
