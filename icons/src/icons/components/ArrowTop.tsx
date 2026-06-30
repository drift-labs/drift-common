import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowTop = (allProps: IconProps) => {
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
						d="M4.47 11.53a.75.75 0 010-1.06l7-7a.75.75 0 011.06 0l7 7a.75.75 0 11-1.06 1.06l-5.72-5.72V20a.75.75 0 11-1.5 0V5.81l-5.72 5.72a.75.75 0 01-1.06 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ArrowTop;
