import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LiqFull = (allProps: IconProps) => {
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
					<circle
						cx={8}
						cy={8}
						r={6}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.8}
					/>
					<circle
						cx={7.999}
						cy={8}
						r={4.267}
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LiqFull;
