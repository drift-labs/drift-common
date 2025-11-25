import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Subtract = ({ svgProps, ...rest }: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M19.821 12.071a.75.75 0 0 1-.75.75H4.93a.75.75 0 0 1 0-1.5H19.07a.75.75 0 0 1 .75.75"
						fill={svgProps.color ? svgProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default Subtract;
