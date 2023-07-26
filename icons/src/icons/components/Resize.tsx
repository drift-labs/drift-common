import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Resize = (allProps: IconProps) => {
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
						d="M13.952 2.372A.6.6 0 0013.4 2H9.8a.6.6 0 100 1.2h2.154L3.2 11.954V9.8a.6.6 0 10-1.2 0v3.6a.6.6 0 00.6.6h3.6a.6.6 0 100-1.2H4.046L12.8 4.046V6.2a.6.6 0 101.2 0V2.6a.6.6 0 00-.048-.228z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Resize;
