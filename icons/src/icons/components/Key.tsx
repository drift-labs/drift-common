import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Key = (allProps: IconProps) => {
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
						d="M15.111 11l-4 4.05m3.111-3.15l.89.9m-3.556 3.6c0 .994-.796 1.8-1.778 1.8A1.789 1.789 0 018 16.4c0-.994.796-1.8 1.778-1.8s1.778.806 1.778 1.8z"
						stroke="#000"
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M6.75 2.25c-.67 0-1.308.274-1.775.754A2.576 2.576 0 004.25 4.8v14.4c0 .67.258 1.316.725 1.796.467.48 1.105.754 1.775.754h10.5c.67 0 1.308-.274 1.775-.754.467-.48.725-1.126.725-1.796V7.95a.75.75 0 00-.212-.523l-4.813-4.95a.75.75 0 00-.537-.227H6.75zm7.75 2.147l3.162 3.253H14.5V4.397zM13 8.4V3.75H6.75a.976.976 0 00-.7.3c-.19.195-.3.465-.3.75v14.4c0 .285.11.555.3.75.19.195.442.3.7.3h10.5c.258 0 .51-.105.7-.3.19-.195.3-.465.3-.75V9.15h-4.5A.75.75 0 0113 8.4zm2.645 3.127a.75.75 0 10-1.067-1.054l-.888.899-.003.002-2.733 2.768a2.499 2.499 0 00-1.176-.292C8.373 13.85 7.25 15 7.25 16.4s1.123 2.55 2.528 2.55 2.528-1.15 2.528-2.55c0-.43-.107-.837-.295-1.194l2.211-2.239.356.36a.75.75 0 101.067-1.054l-.369-.373.369-.373zM8.75 16.4c0-.589.469-1.05 1.028-1.05a1.04 1.04 0 011.028 1.05 1.04 1.04 0 01-1.028 1.05A1.04 1.04 0 018.75 16.4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Key;
