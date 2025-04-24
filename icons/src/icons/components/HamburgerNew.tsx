import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const HamburgerNew = (allProps: IconProps) => {
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
					<path d="M18 10a4 4 0 100-8 4 4 0 000 8z" fill="#B58AFF" />
					<path
						d="M13.056 5.25a5.04 5.04 0 000 1.5H4a.75.75 0 010-1.5h9.056zM4 11.25a.75.75 0 000 1.5h16a.75.75 0 000-1.5H4zM4 17.25a.75.75 0 000 1.5h16a.75.75 0 000-1.5H4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default HamburgerNew;
