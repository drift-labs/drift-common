import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trophy = (allProps: IconProps) => {
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
						d="M13 3.5h-1V3a1.001 1.001 0 00-1-1H5a1 1 0 00-1 1v.5H3a1 1 0 00-1 1V6a2.002 2.002 0 002 2h.161A4.084 4.084 0 007.5 10.967V13H5v1h6v-1H8.5v-2.034A3.983 3.983 0 0011.87 8H12a2.003 2.003 0 002-2V4.5a1.001 1.001 0 00-1-1zM4 7a1 1 0 01-1-1V4.5h1V7zm7 0a2.999 2.999 0 01-3.093 2.998A3.1 3.1 0 015 6.854V3h6v4zm2-1a1.001 1.001 0 01-1 1V4.5h1V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trophy;
