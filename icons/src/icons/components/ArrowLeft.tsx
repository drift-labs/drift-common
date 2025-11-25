import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ArrowLeft = ({ svgProps, ...rest }: IconProps) => {
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
						d="M11.5302 19.5303C11.2373 19.8232 10.7626 19.8232 10.4697 19.5303L3.46967 12.5303C3.17677 12.2374 3.17677 11.7626 3.46967 11.4697L10.4697 4.46973C10.7626 4.17683 11.2373 4.17683 11.5302 4.46973C11.8231 4.76262 11.8231 5.23738 11.5302 5.53027L5.81049 11.25L19.9999 11.25C20.4142 11.25 20.7499 11.5858 20.7499 12C20.7499 12.4142 20.4142 12.75 19.9999 12.75L5.81049 12.75L11.5302 18.4697C11.8231 18.7626 11.8231 19.2374 11.5302 19.5303Z"
						fill={svgProps.color ? svgProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...rest}
		/>
	);
};

export default ArrowLeft;
