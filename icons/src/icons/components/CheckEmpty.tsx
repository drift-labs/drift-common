import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CheckEmpty = (allProps: IconProps) => {
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
					<rect
						x={2}
						y={2}
						width={12}
						height={12}
						rx={1}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.25}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CheckEmpty;
