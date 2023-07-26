import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowRight = (allProps: IconProps) => {
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
						d="M9.53 2.803a.75.75 0 00-1.06 1.06l3.386 3.387H3a.75.75 0 000 1.5h8.856L8.47 12.136a.75.75 0 101.06 1.06l4.667-4.666a.75.75 0 000-1.06L9.53 2.803z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ArrowRight;
