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
						d="M4 5.25a.25.25 0 00-.25.25v2.75h16.5V5.5a.25.25 0 00-.25-.25H4zM3.75 18.5V9.75h4.5v9H4a.25.25 0 01-.25-.25zm6 .25H20a.25.25 0 00.25-.25V9.75H9.75v9zM2.25 5.5c0-.966.784-1.75 1.75-1.75h16c.966 0 1.75.784 1.75 1.75v13A1.75 1.75 0 0120 20.25H4a1.75 1.75 0 01-1.75-1.75v-13z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Layout;
