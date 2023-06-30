import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeMinimize = (allProps: IconProps) => {
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
						d="M12.333 12.667H3.667a.667.667 0 100 1.333h8.666a.667.667 0 000-1.333z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
					<path
						d="M3.333 13.333V2.667C3.333 2.298 3.632 2 4 2h8c.368 0 .667.298.667.667v10.666"
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
export default ResizeMinimize;
