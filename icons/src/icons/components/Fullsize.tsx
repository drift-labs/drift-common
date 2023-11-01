import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Fullsize = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="100%"
					height="100%"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M12.333 1H3.667A.667.667 0 003 1.667v12.666c0 .368.298.667.667.667h8.666a.667.667 0 00.667-.667V1.667A.667.667 0 0012.333 1z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Fullsize;
