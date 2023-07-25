import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PieChart = (allProps: IconProps) => {
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
						d="M7.067 1.576a1.2 1.2 0 00-.536-.027 6.6 6.6 0 107.92 7.92.6.6 0 00.016-.136A1.266 1.266 0 0013.2 8.067h-2.533a.6.6 0 00-.581.449 2.134 2.134 0 11-2.602-2.602.6.6 0 00.45-.58V2.666a1.2 1.2 0 00-.866-1.091zM4.302 4.064a5.4 5.4 0 012.431-1.33v2.17a3.333 3.333 0 104.363 4.363H13.2a.067.067 0 01.058.033 5.4 5.4 0 11-8.956-5.236zm5.897-2.297a.6.6 0 00-.799.566v3a.6.6 0 00.21.457c.216.184.417.384.6.6a.6.6 0 00.457.21h3a.6.6 0 00.566-.8 6.6 6.6 0 00-4.034-4.033zm.401 3.298v-1.81A5.399 5.399 0 0112.744 5.4h-1.809a6.573 6.573 0 00-.335-.335z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PieChart;
