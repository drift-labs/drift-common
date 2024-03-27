import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeOnethird = (allProps: IconProps) => {
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
						d="M4.25 16c0-.966.784-1.75 1.75-1.75h12c.966 0 1.75.784 1.75 1.75v4A1.75 1.75 0 0118 21.75H6A1.75 1.75 0 014.25 20v-4zM6 15.75a.25.25 0 00-.25.25v4c0 .138.112.25.25.25h12a.25.25 0 00.25-.25v-4a.25.25 0 00-.25-.25H6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6 3.75a.25.25 0 00-.25.25v1.375h-1.5V4c0-.966.784-1.75 1.75-1.75h1.5v1.5H6zm5.5 0h-3v-1.5h3v1.5zm4 0h-3v-1.5h3v1.5zm2.5 0h-1.5v-1.5H18c.966 0 1.75.784 1.75 1.75v1.375h-1.5V4a.25.25 0 00-.25-.25zM5.75 6.292v2.75h-1.5v-2.75h1.5zm12.5 2.75v-2.75h1.5v2.75h-1.5zm-12.5.916v2.75h-1.5v-2.75h1.5zm12.5 2.75v-2.75h1.5v2.75h-1.5zM5.75 14.25v-.625h-1.5v2.125h2.063v-1.5H5.75zm12.5 0v-.625h1.5v2.125h-2.063v-1.5h.563zm-7.563 0h2.626v1.5h-2.626v-1.5zm-3.5 0h2.625v1.5H7.188v-1.5zm7 0h2.626v1.5h-2.625v-1.5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ResizeOnethird;
