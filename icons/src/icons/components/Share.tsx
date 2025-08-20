import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Share = (allProps: IconProps) => {
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
						d="M20.25 19a2.25 2.25 0 00-4.139-1.222.748.748 0 01-.101.173A2.25 2.25 0 1020.25 19zm-12-7a2.25 2.25 0 10-4.5 0 2.25 2.25 0 004.5 0zm12-7a2.25 2.25 0 10-4.5 0 2.25 2.25 0 004.5 0zm1.5 0a3.75 3.75 0 01-6.546 2.498l-5.653 3.299a3.742 3.742 0 010 2.405l5.656 3.295a3.75 3.75 0 11-.758 1.295l-5.654-3.294a3.75 3.75 0 110-4.997l5.653-3.299A3.75 3.75 0 1121.75 5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Share;
