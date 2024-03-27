import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Stats = (allProps: IconProps) => {
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
						d="M4 3.25a.75.75 0 01.75.75v15.25H21a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75V4A.75.75 0 014 3.25zm9.19 1.778a.75.75 0 01.75.75v10.666a.75.75 0 11-1.5 0V5.778a.75.75 0 01.75-.75zm4.594 2.457a.75.75 0 01.75.75v8.21a.75.75 0 11-1.5 0v-8.21a.75.75 0 01.75-.75zm-9.19 2.824a.75.75 0 01.75.75v5.385h-1.5V11.06a.75.75 0 01.75-.75zm0 6.885a.75.75 0 01-.75-.75h1.5a.75.75 0 01-.75.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Stats;
