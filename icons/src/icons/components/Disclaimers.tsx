import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Disclaimers = (allProps: IconProps) => {
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
						d="M13 6.914V13a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13V3a1.5 1.5 0 011.5-1.5h3.086a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinejoin="round"
					/>
					<path
						d="M8 1.75V5.5a1 1 0 001 1h3.75"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Disclaimers;
