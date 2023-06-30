import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeFull = (allProps: IconProps) => {
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
						d="M12 2H4a.667.667 0 00-.667.667v10.666c0 .368.299.667.667.667h8a.667.667 0 00.667-.667V2.667A.667.667 0 0012 2z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ResizeFull;
