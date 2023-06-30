import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Twitter = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M15.033 3.802a5.95 5.95 0 01-1.657.437 2.806 2.806 0 001.268-1.536 5.918 5.918 0 01-1.832.674 2.931 2.931 0 00-2.105-.877c-1.593 0-2.885 1.243-2.885 2.777 0 .217.026.43.075.632a8.3 8.3 0 01-5.947-2.9c-.248.41-.39.886-.39 1.395 0 .964.508 1.813 1.282 2.311a2.962 2.962 0 01-1.307-.347v.035c0 1.346.994 2.468 2.314 2.723a2.987 2.987 0 01-1.303.047c.367 1.103 1.433 1.906 2.695 1.929a5.931 5.931 0 01-3.583 1.189c-.232 0-.462-.013-.688-.039A8.4 8.4 0 005.392 13.5c5.306 0 8.209-4.23 8.209-7.9 0-.121-.003-.24-.009-.36a5.738 5.738 0 001.441-1.438z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Twitter;
