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
						d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 9c-.414 0-1 .403-1 .817v5.5c0 .414.586.683 1 .683.414 0 1-.336 1-.75v-5.433c0-.414-.586-.817-1-.817zm0-4a1 1 0 100 2 1 1 0 000-2z"
						fill="#F2C94C"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default WarningFilled;
