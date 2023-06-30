import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Download = (allProps: IconProps) => {
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
						d="M9.54 10.92l-.873.84V8a.667.667 0 10-1.334 0v3.727l-.86-.867a.668.668 0 00-1.092.73.67.67 0 00.146.217l2 2a.667.667 0 00.933.006l2-1.933a.667.667 0 10-.92-.96z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M11.78 4.667a4 4 0 00-7.56 0 3.333 3.333 0 00-2.053 5.513.667.667 0 101-.847A2 2 0 014.667 6h.066a.667.667 0 00.667-.533 2.667 2.667 0 015.227 0 .667.667 0 00.666.533h.04a2 2 0 011.5 3.333.667.667 0 00.5 1.114.668.668 0 00.5-.227 3.333 3.333 0 00-2.053-5.553z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Download;
