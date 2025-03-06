import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Gas = (allProps: IconProps) => {
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
						d="M4.897 2.997A2.55 2.55 0 016.7 2.25h5.4a2.55 2.55 0 012.55 2.55v7.35h1.05a2.55 2.55 0 012.55 2.55v1.8a1.05 1.05 0 002.1 0v-6.453a1.052 1.052 0 00-.31-.746l-.001-.002-3.07-3.069a.75.75 0 011.061-1.06l3.068 3.067v.001a2.549 2.549 0 01.752 1.81V16.5a2.55 2.55 0 01-5.1 0v-1.8a1.05 1.05 0 00-1.05-1.05h-1.05v6.6h.15a.75.75 0 010 1.5H4a.75.75 0 010-1.5h.15V4.8c0-.676.269-1.325.747-1.803zm.753 7.053v10.2h7.5v-10.2h-7.5zm7.5-1.5h-7.5V4.8A1.05 1.05 0 016.7 3.75h5.4a1.05 1.05 0 011.05 1.05v3.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M9.406 17.392c.504 0 .93-.171 1.278-.513.348-.342.522-.76.522-1.251 0-.396-.114-.735-.342-1.017a92.59 92.59 0 00-1.458-1.72c-.756.865-1.245 1.44-1.467 1.729a1.604 1.604 0 00-.333 1.008c0 .492.174.909.522 1.25.348.343.774.514 1.278.514z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Gas;
