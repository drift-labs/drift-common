import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Telegram = (allProps: IconProps) => {
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
						d="M16.133 14.648l-.04.25a72.251 72.251 0 01-1.62-1.08c.74-.696 1.478-1.401 2.114-2.02l-.454 2.85z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={5}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Telegram;
