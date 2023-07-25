import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trash = (allProps: IconProps) => {
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
						d="M6.667 3.333h2.666a1.333 1.333 0 00-2.666 0zm-1 0a2.333 2.333 0 114.666 0h3.834a.5.5 0 110 1h-.88l-.78 8.074a2.5 2.5 0 01-2.49 2.26H5.983a2.5 2.5 0 01-2.489-2.26l-.78-8.074h-.88a.5.5 0 110-1h3.833zM7 6.5a.5.5 0 00-1 0v5a.5.5 0 001 0v-5zM9.5 6a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5zm-5.01 6.311a1.5 1.5 0 001.493 1.356h4.034a1.5 1.5 0 001.494-1.356l.772-7.978H3.717l.772 7.978z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trash;
