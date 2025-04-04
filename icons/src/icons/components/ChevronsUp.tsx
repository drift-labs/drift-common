import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronsUp = (allProps: IconProps) => {
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
						d="M5.462 19.523a.75.75 0 01.015-1.06l6-5.834a.75.75 0 011.046 0l6 5.833a.75.75 0 11-1.046 1.076L12 14.213l-5.477 5.325a.75.75 0 01-1.06-.015zm0-8.167a.75.75 0 01.015-1.06l6-5.834a.75.75 0 011.046 0l6 5.834a.75.75 0 11-1.046 1.075L12 6.046l-5.477 5.325a.75.75 0 01-1.06-.015z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ChevronsUp;
