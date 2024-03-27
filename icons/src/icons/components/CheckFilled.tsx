import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CheckFilled = (allProps: IconProps) => {
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
						d="M3.25 4A.75.75 0 014 3.25h16a.75.75 0 01.75.75v16a.75.75 0 01-.75.75H4a.75.75 0 01-.75-.75V4zm1.5.75v14.5h14.5V4.75H4.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M17.53 8.47a.75.75 0 010 1.06l-7.016 7a.75.75 0 01-1.09-.031L6.44 13.151a.75.75 0 111.12-.998l2.456 2.756 6.454-6.44a.75.75 0 011.06.001z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CheckFilled;
