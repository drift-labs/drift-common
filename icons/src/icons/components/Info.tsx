import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Info = (allProps: IconProps) => {
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
						d="M7.833 13.667A5.833 5.833 0 107.833 2a5.833 5.833 0 000 11.667zM7.833 10.167V7.834M7.833 5.5h.007"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.19}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Info;
