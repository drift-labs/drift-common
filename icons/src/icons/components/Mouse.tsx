import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Mouse = (allProps: IconProps) => {
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
					<path d="M9 9l5 12 1.8-5.2L21 14 9 9z" fill="#000" />
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8.646 8.646a.5.5 0 01.546-.108l12 5a.5.5 0 01-.028.934l-4.97 1.721-1.721 4.97a.5.5 0 01-.934.03l-5-12a.5.5 0 01.107-.547zM9.93 9.93l4.028 9.667 1.37-3.96a.5.5 0 01.31-.308l3.96-1.371-9.668-4.028z"
						fill="#fff"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Mouse;
