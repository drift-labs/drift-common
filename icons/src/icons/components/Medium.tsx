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
						d="M8.076 7.35c2.616 0 4.727 2.087 4.727 4.65s-2.112 4.65-4.727 4.65S3.35 14.563 3.35 12s2.11-4.65 4.726-4.65zm8.108.293c.51 0 1.052.39 1.487 1.195.427.791.701 1.909.701 3.162l-.013.463c-.058 1.064-.315 2.006-.688 2.7-.434.805-.977 1.194-1.487 1.194-.511 0-1.052-.39-1.487-1.195-.426-.791-.702-1.909-.702-3.162s.276-2.37.702-3.162c.435-.806.976-1.195 1.487-1.195zm3.958.628c.087.175.176.45.255.82.155.733.253 1.761.253 2.909 0 1.147-.098 2.176-.253 2.91-.079.368-.168.644-.255.819-.012.023-.025.042-.036.06l-.033-.06c-.087-.175-.177-.45-.255-.82-.155-.733-.254-1.761-.254-2.909s.1-2.176.254-2.91c.078-.368.168-.644.255-.819l.033-.06c.01.018.024.037.036.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.7}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Medium;
