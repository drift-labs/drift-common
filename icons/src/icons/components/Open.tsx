import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Open = (allProps: IconProps) => {
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
						d="M6.5 2H4a2 2 0 00-2 2v8.5a2 2 0 002 2h8a2 2 0 002-2v-3M9.5 6.5L14 2M9.5 2h4.25a.25.25 0 01.25.25V6.5"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.25}
						strokeLinecap="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Open;
