import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const EyeHide = (allProps: IconProps) => {
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
						d="M7.05 7.286C4.255 9.06 3 12 3 12s2.7 6 9 6c1.881 0 3.237-.75 4.5-1.5M9.574 6.317C10.314 6.117 11.122 6 12 6c6.3 0 9 6 9 6s-.675 1.5-2.137 3"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M4 4l16 16"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.966 9.795a3 3 0 104.24 4.24l-4.24-4.24z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default EyeHide;
