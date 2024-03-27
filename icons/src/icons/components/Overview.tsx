import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Overview = (allProps: IconProps) => {
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
						d="M4.5 4.25a.25.25 0 00-.25.25v5c0 .138.112.25.25.25h5a.25.25 0 00.25-.25v-5a.25.25 0 00-.25-.25h-5zm-1.75.25c0-.966.784-1.75 1.75-1.75h5c.966 0 1.75.784 1.75 1.75v5a1.75 1.75 0 01-1.75 1.75h-5A1.75 1.75 0 012.75 9.5v-5zm11.75-.25a.25.25 0 00-.25.25v5c0 .138.112.25.25.25h5a.25.25 0 00.25-.25v-5a.25.25 0 00-.25-.25h-5zm-1.75.25c0-.966.784-1.75 1.75-1.75h5c.966 0 1.75.784 1.75 1.75v5a1.75 1.75 0 01-1.75 1.75h-5a1.75 1.75 0 01-1.75-1.75v-5zM4.5 14.25a.25.25 0 00-.25.25v5c0 .138.112.25.25.25h5a.25.25 0 00.25-.25v-5a.25.25 0 00-.25-.25h-5zm-1.75.25c0-.966.784-1.75 1.75-1.75h5c.966 0 1.75.784 1.75 1.75v5a1.75 1.75 0 01-1.75 1.75h-5a1.75 1.75 0 01-1.75-1.75v-5zm11.75-.25a.25.25 0 00-.25.25v5c0 .138.112.25.25.25h5a.25.25 0 00.25-.25v-5a.25.25 0 00-.25-.25h-5zm-1.75.25c0-.966.784-1.75 1.75-1.75h5c.966 0 1.75.784 1.75 1.75v5a1.75 1.75 0 01-1.75 1.75h-5a1.75 1.75 0 01-1.75-1.75v-5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Overview;
