import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Alert = (allProps: IconProps) => {
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
						d="M8.003 3.146c-3.107 0-3.551 2.664-3.551 4.883 0 2.22-1.332 3.552-1.332 3.552h9.766s-1.331-1.332-1.331-3.552c0-2.22-.444-4.883-3.552-4.883zm0 0v-.533m1.776 8.968s0 1.776-1.776 1.776-1.776-1.776-1.776-1.776H9.78z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.25}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Alert;
