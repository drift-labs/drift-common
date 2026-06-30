import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowBottom = (allProps: IconProps) => {
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
						d="M19.53 12.47a.75.75 0 010 1.06l-7 7a.75.75 0 01-1.06 0l-7-7a.75.75 0 111.06-1.06l5.72 5.72V4a.75.75 0 011.5 0v14.19l5.72-5.72a.75.75 0 011.06 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ArrowBottom;
