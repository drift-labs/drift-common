import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bridge = (allProps: IconProps) => {
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
						d="M13.4 2.938H4.288c-.863 0-2.588.482-2.588 2.512 0 2.03 1.725 2.54 2.588 2.54H6M2.353 13.052h9.467c.862 0 2.532-.506 2.532-2.536 0-2.03-1.67-2.525-2.532-2.525H10"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M2.98 11.784L1.72 13.07l1.259 1.247M12.468 1.65l1.258 1.286-1.258 1.247"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.949}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<circle
						cx={8}
						cy={8}
						r={2}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bridge;
