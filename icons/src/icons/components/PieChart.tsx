import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PieChart = (allProps: IconProps) => {
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
						d="M11.47 2.47a.75.75 0 01.53-.22 9.748 9.748 0 019.75 9.752.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75V3a.75.75 0 01.22-.53zm1.28 1.314v7.468h7.466a8.258 8.258 0 00-5.059-6.874 8.248 8.248 0 00-2.407-.594zm-3.662-.337a.75.75 0 01-.388.988 8.25 8.25 0 00-4.573 10.03 8.252 8.252 0 009.476 5.628 8.25 8.25 0 005.995-4.881.75.75 0 011.382.584 9.752 9.752 0 01-11.788 5.541 9.75 9.75 0 01-6.777-11.124A9.753 9.753 0 018.1 3.06a.75.75 0 01.988.387z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PieChart;
