import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Resize = (allProps: IconProps) => {
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
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13 5.75a.75.75 0 010-1.5h6a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0V6.81L6.81 18.25H11a.75.75 0 010 1.5H5a.75.75 0 01-.75-.75v-6a.75.75 0 011.5 0v4.19L17.19 5.75H13z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Resize;
