import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Phoenix = (allProps: IconProps) => {
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
						d="M4 3.047L11.977 12 20 3l-4.137 3.013a6.613 6.613 0 01-7.736.014L4 3.047zM4 20.955L11.978 12 20 21l-4.137-3.013a6.613 6.613 0 00-7.738-.014L4 20.955z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Phoenix;
