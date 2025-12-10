import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Collapse = (allProps: IconProps) => {
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
						d="M20.25 5c0-.69-.56-1.25-1.25-1.25H9.75v16.5H19c.69 0 1.25-.56 1.25-1.25V5zm-4.78 3.47a.75.75 0 111.06 1.06L14.06 12l2.47 2.47a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3zM3.75 19c0 .69.56 1.25 1.25 1.25h3.25V3.75H5c-.69 0-1.25.56-1.25 1.25v14zm18 0A2.75 2.75 0 0119 21.75H5A2.75 2.75 0 012.25 19V5A2.75 2.75 0 015 2.25h14A2.75 2.75 0 0121.75 5v14z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Collapse;
