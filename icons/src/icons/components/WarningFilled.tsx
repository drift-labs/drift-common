import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const WarningFilled = (allProps: IconProps) => {
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
						d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-10-.75a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4a.75.75 0 01.75-.75zM12 9a1 1 0 100-2 1 1 0 000 2z"
						fill="#F2C94C"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default WarningFilled;
