import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const TradingUp = (allProps: IconProps) => {
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
						d="M15.25 6a.75.75 0 01.75-.75h5a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0V7.973l-6.69 7.525a.75.75 0 01-1.09.032L9 12.06l-5.47 5.47a.75.75 0 01-1.06-1.06l6-6a.75.75 0 011.06 0l3.438 3.437L19.33 6.75H16a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default TradingUp;
