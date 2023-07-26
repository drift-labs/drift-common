import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LendBorrow = (allProps: IconProps) => {
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
						d="M5.923 3.45A2.001 2.001 0 013.45 5.923 4.982 4.982 0 003 8c0 .632.117 1.237.331 1.794a2 2 0 012.308 2.615 5.001 5.001 0 006.962-2.448 2 2 0 010-3.921 5.001 5.001 0 00-6.678-2.59zM2.585 5.413A5.976 5.976 0 002 8c0 .793.154 1.55.434 2.244a2 2 0 102.647 2.999 6.002 6.002 0 008.621-3.37 2 2 0 000-3.746 6.003 6.003 0 00-8.289-3.542 2 2 0 00-2.828 2.828zM12 8a1 1 0 112 0 1 1 0 01-2 0zm-8.25 2.75a1 1 0 100 2 1 1 0 000-2zM3 4a1 1 0 112 0 1 1 0 01-2 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LendBorrow;
