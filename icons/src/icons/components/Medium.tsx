import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Medium = (allProps: IconProps) => {
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
						d="M8.077 7c2.803 0 5.076 2.239 5.076 5s-2.273 5-5.076 5C5.273 17 3 14.761 3 12s2.273-5 5.077-5zm8.107.293c1.401 0 2.538 2.107 2.538 4.707 0 2.6-1.136 4.707-2.538 4.707S13.645 14.6 13.645 12c0-2.6 1.137-4.707 2.539-4.707zm3.923.49C20.6 7.783 21 9.671 21 12c0 2.328-.4 4.217-.893 4.217s-.892-1.888-.892-4.217c0-2.329.4-4.217.892-4.217z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Medium;
