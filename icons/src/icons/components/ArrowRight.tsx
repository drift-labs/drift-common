import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowRight = (allProps: IconProps) => {
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
						d="M11.47 4.47a.75.75 0 011.06 0l7 7a.75.75 0 010 1.06l-7 7a.75.75 0 11-1.06-1.06l5.72-5.72H5a.75.75 0 010-1.5h12.19l-5.72-5.72a.75.75 0 010-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ArrowRight;
