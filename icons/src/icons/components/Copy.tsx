import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Copy = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.333 3.2h7.334c.073 0 .133.06.133.133v1.334H12V3.333C12 2.597 11.403 2 10.667 2H3.333C2.597 2 2 2.597 2 3.333v7.334C2 11.403 2.597 12 3.333 12h1.334v-1.2H3.333a.133.133 0 01-.133-.133V3.333c0-.073.06-.133.133-.133z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<rect
						x={5.267}
						y={5.267}
						width={8.133}
						height={8.133}
						rx={0.644}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Copy;
