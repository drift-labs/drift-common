import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Google = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M4.869 8.408A8.06 8.06 0 017.878 5.19 8.284 8.284 0 0112.163 4c2.2 0 4.048.792 5.462 2.084l-2.34 2.294c-.847-.792-1.923-1.196-3.122-1.196-2.126 0-3.926 1.408-4.567 3.298-.163.48-.256.992-.256 1.52s.093 1.04.256 1.52c.642 1.891 2.44 3.298 4.567 3.298 1.098 0 2.033-.284 2.764-.764a3.719 3.719 0 001.068-1.043c.28-.415.47-.881.562-1.371h-4.394v-3.094h7.688c.097.523.149 1.068.149 1.636 0 2.436-.89 4.488-2.434 5.88C16.216 19.284 14.367 20 12.163 20a8.305 8.305 0 01-3.124-.608 8.174 8.174 0 01-2.649-1.734 7.988 7.988 0 01-1.77-2.596 7.858 7.858 0 01.249-6.654z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Google;
