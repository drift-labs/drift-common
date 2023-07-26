import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Show = (allProps: IconProps) => {
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
						d="M8 9.333a1.333 1.333 0 100-2.666 1.333 1.333 0 000 2.666z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M14.667 8c-1.778 3.111-4 4.667-6.667 4.667S3.111 11.11 1.333 8c1.778-3.111 4-4.667 6.667-4.667S12.889 4.89 14.667 8z"
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
export default Show;
