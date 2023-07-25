import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Stats = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.917 1.917c.368 0 .666.335.666.75v10.666c0 .414-.298.75-.666.75-.369 0-.667-.336-.667-.75V2.667c0-.415.298-.75.667-.75zm4.25 3c.368 0 .666.335.666.75v7.666c0 .414-.298.75-.666.75-.368 0-.667-.336-.667-.75V5.666c0-.414.299-.75.667-.75zM4.333 8.334c0-.415-.298-.75-.666-.75-.369 0-.667.335-.667.75v5c0 .414.298.75.667.75.368 0 .666-.336.666-.75v-5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Stats;
