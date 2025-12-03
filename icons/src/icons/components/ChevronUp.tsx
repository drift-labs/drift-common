import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronUp = ({ svgProps, ...rest }: IconProps) => {
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
						d="M11.526 7.418a.75.75 0 0 1 1.004.052l8 8a.75.75 0 1 1-1.06 1.06L12 9.06l-7.47 7.47a.75.75 0 1 1-1.06-1.06l8-8z"
						fill={rest.color ? rest.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ChevronUp;
