import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronRight = ({ svgProps, ...rest }: IconProps) => {
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...svgProps}
				>
					<path
						d="M16.75 12a.75.75 0 0 1-.256.565l-8 7a.75.75 0 0 1-.988-1.13L14.86 12 7.506 5.564a.75.75 0 0 1 .988-1.128l8 7 .058.056a.75.75 0 0 1 .198.508"
						fill={rest.color ? rest.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ChevronRight;
