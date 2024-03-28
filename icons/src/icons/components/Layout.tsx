import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Layout = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M5 5.75a.25.25 0 00-.25.25v2.25h14.5V6a.25.25 0 00-.25-.25H5zM4.75 18V9.75h3.5v8.5H5a.25.25 0 01-.25-.25zm5 .25H19a.25.25 0 00.25-.25V9.75h-9.5v8.5zM3.25 6c0-.966.784-1.75 1.75-1.75h14c.966 0 1.75.784 1.75 1.75v12A1.75 1.75 0 0119 19.75H5A1.75 1.75 0 013.25 18V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Layout;
