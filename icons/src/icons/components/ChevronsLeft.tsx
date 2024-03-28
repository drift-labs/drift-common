import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronsLeft = (allProps: IconProps) => {
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
						d="M19.523 18.538a.75.75 0 01-1.06-.015l-5.834-6a.75.75 0 010-1.046l5.833-6a.75.75 0 111.076 1.046L14.213 12l5.325 5.477a.75.75 0 01-.015 1.06zm-8.167 0a.75.75 0 01-1.06-.015l-5.834-6a.75.75 0 010-1.046l5.834-6a.75.75 0 111.075 1.046L6.046 12l5.325 5.477a.75.75 0 01-.015 1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ChevronsLeft;
