import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Calendar = (allProps: IconProps) => {
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
						d="M8.444 2.25a.75.75 0 01.75.75v1.05h5.612V3a.75.75 0 111.5 0v1.05h1.916c1.405 0 2.528 1.15 2.528 2.55v12.6c0 1.4-1.123 2.55-2.528 2.55H5.778c-1.405 0-2.528-1.15-2.528-2.55V6.6c0-1.4 1.123-2.55 2.528-2.55h1.916V3a.75.75 0 01.75-.75zm-.75 3.3H5.778A1.04 1.04 0 004.75 6.6v2.85h14.5V6.6a1.04 1.04 0 00-1.028-1.05h-1.916V6.6a.75.75 0 01-1.5 0V5.55H9.194V6.6a.75.75 0 11-1.5 0V5.55zm11.556 5.4H4.75v8.25c0 .589.469 1.05 1.028 1.05h12.444a1.04 1.04 0 001.028-1.05v-8.25z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Calendar;
