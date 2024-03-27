import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ResizeMinimize = (allProps: IconProps) => {
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
						d="M19 18H5v2a1 1 0 001 1h12a1 1 0 001-1v-2z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4.25 17.25h15.5V20A1.75 1.75 0 0118 21.75H6A1.75 1.75 0 014.25 20v-2.75zm1.5 1.5V20c0 .138.112.25.25.25h12a.25.25 0 00.25-.25v-1.25H5.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6 3.75a.25.25 0 00-.25.25v1.406h-1.5V4c0-.966.784-1.75 1.75-1.75h1.5v1.5H6zm5.5 0h-3v-1.5h3v1.5zm4 0h-3v-1.5h3v1.5zm2.5 0h-1.5v-1.5H18c.966 0 1.75.784 1.75 1.75v1.406h-1.5V4a.25.25 0 00-.25-.25zM5.75 6.344v2.812h-1.5V6.344h1.5zm12.5 2.812V6.344h1.5v2.812h-1.5zm-12.5.938v2.812h-1.5v-2.812h1.5zm12.5 2.812v-2.812h1.5v2.812h-1.5zm-12.5.938v2.812h-1.5v-2.812h1.5zm12.5 2.812v-2.812h1.5v2.812h-1.5zM5.75 18.25v-.656h-1.5v2.156h2.063v-1.5H5.75zm12.5 0v-.656h1.5v2.156h-2.063v-1.5h.563zm-7.563 0h2.626v1.5h-2.626v-1.5zm-3.5 0h2.625v1.5H7.188v-1.5zm7 0h2.626v1.5h-2.625v-1.5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ResizeMinimize;
