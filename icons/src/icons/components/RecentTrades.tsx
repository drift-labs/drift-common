import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const RecentTrades = (allProps: IconProps) => {
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
						d="M2 8h12M2 8v3m0-3V5m12 3v3m0-3V5M2 11v2.6a.4.4 0 00.4.4h11.2a.4.4 0 00.4-.4V11M2 11h12M2 5V2.4a.4.4 0 01.4-.4h11.2a.4.4 0 01.4.4V5M2 5h12"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default RecentTrades;
