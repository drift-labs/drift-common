import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronLeft = ({ svgProps, ...rest }: IconProps) => {
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
						d="M7.25 12C7.25 11.7838 7.34318 11.578 7.50586 11.4355L15.5059 4.43555C15.8175 4.16283 16.2917 4.19426 16.5645 4.50586C16.8372 4.81754 16.8057 5.29167 16.4941 5.56445L9.13867 12L16.4941 18.4355C16.8057 18.7083 16.8372 19.1825 16.5645 19.4941C16.2917 19.8057 15.8175 19.8372 15.5059 19.5645L7.50586 12.5645L7.44824 12.5078C7.32149 12.3701 7.25 12.1891 7.25 12Z"
						fill={svgProps.color ? svgProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ChevronLeft;
