import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Fuel = (allProps: IconProps) => {
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
					<circle
						cx={12}
						cy={12}
						r={9.25}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
					/>
					<path
						d="M15.25 13.783c0 1.32-.461 2.161-1.053 2.68-.61.536-1.424.787-2.197.787-.773 0-1.587-.25-2.197-.786-.592-.52-1.053-1.36-1.053-2.68 0-.317.102-.766.315-1.332.21-.554.506-1.167.848-1.795.677-1.24 1.502-2.486 2.102-3.361a35.412 35.412 0 012.091 3.385c.338.634.63 1.251.835 1.803.211.565.309 1.004.309 1.3z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Fuel;
