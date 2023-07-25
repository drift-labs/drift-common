import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PNL = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8 1.05a.704.704 0 00-.703.704v6.255c0 .389.315.704.704.704h6.255a.704.704 0 00.704-.704A6.958 6.958 0 008 1.05zm.704 6.255V2.502a5.551 5.551 0 014.803 4.803H8.704zM5.78 2.9a.704.704 0 10-.563-1.29 6.96 6.96 0 109.193 9.089.704.704 0 00-1.296-.549A5.552 5.552 0 115.779 2.9z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PNL;
