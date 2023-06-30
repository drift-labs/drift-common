import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeOnethird = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M12 10H4a.667.667 0 00-.667.667v2.666c0 .368.299.667.667.667h8a.667.667 0 00.667-.667v-2.666A.667.667 0 0012 10z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
					<path
						d="M3.333 11.333V2.667C3.333 2.298 3.632 2 4 2h8c.368 0 .667.298.667.667v8.666"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeDasharray="1.33 1.33"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ResizeOnethird;
