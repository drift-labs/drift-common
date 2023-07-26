import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeTwothirds = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M12 6H4a.667.667 0 00-.667.667v6.666c0 .368.299.667.667.667h8a.667.667 0 00.667-.667V6.667A.667.667 0 0012 6z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
					<g clipPath="url(#prefix__clip0_31656_40353)">
						<path
							d="M3.5 6.75V2.667c0-.369.298-.667.667-.667h7.666c.368 0 .667.298.667.667V6.75"
							stroke={allProps.color ? allProps.color : 'currentColor'}
							strokeWidth={1.2}
							strokeDasharray="1.33 1.33"
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_31656_40353">
							<path fill="#fff" transform="translate(2 1)" d="M0 0h12v5H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ResizeTwothirds;
