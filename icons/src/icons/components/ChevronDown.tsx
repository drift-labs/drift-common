import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronDown = ({ svgProps, ...rest }: IconProps) => {
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					{...svgProps}
				>
					<path
						d="M12.474 16.582a.75.75 0 0 1-1.004-.052l-8-8a.75.75 0 1 1 1.06-1.06L12 14.94l7.47-7.47a.75.75 0 1 1 1.06 1.06l-8 8z"
						fill={svgProps.color ? svgProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ChevronDown;
