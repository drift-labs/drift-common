import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Expand = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3 1.4a.6.6 0 01.6-.6h8.8a.6.6 0 110 1.2H3.6a.6.6 0 01-.6-.6zm0 13a.6.6 0 01.6-.6h8.8a.6.6 0 110 1.2H3.6a.6.6 0 01-.6-.6zM8.401 3.054a.6.6 0 00-.802 0l-2.5 2.25a.6.6 0 00.802.892L7.4 4.847v6.306L5.901 9.804a.6.6 0 10-.802.892l2.5 2.25a.6.6 0 00.802 0l2.5-2.25a.6.6 0 10-.802-.892L8.6 11.153V4.847l1.499 1.349a.6.6 0 00.802-.892l-2.5-2.25z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Expand;
