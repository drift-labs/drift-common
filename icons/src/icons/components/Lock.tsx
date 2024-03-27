import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Lock = (allProps: IconProps) => {
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
						d="M12 3.75c-.977 0-1.915.393-2.61 1.095A3.779 3.779 0 008.307 7.5v2.85h7.388V7.5c0-.998-.391-1.952-1.085-2.655A3.667 3.667 0 0012 3.75zm5.194 6.6V7.5c0-1.39-.545-2.724-1.518-3.709A5.167 5.167 0 0012 2.25c-1.38 0-2.703.555-3.676 1.541A5.279 5.279 0 006.806 7.5v2.85H5.778c-1.405 0-2.528 1.15-2.528 2.55v6.3c0 1.4 1.123 2.55 2.528 2.55h12.444c1.405 0 2.528-1.15 2.528-2.55v-6.3c0-1.4-1.123-2.55-2.528-2.55h-1.028zm-11.416 1.5A1.04 1.04 0 004.75 12.9v6.3c0 .589.469 1.05 1.028 1.05h12.444a1.04 1.04 0 001.028-1.05v-6.3a1.04 1.04 0 00-1.028-1.05H5.778z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Lock;
