import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Terms = (allProps: IconProps) => {
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
						d="M8 1L2 3v6a6 6 0 1012 0V3L8 1zm4.875 8a4.875 4.875 0 01-9.75 0V3.844L8 2.125l4.875 1.719V9z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M5.912 7.423a.56.56 0 00-.96.398.561.561 0 00.165.398l2.055 2.054a.532.532 0 00.751 0l3.493-3.492a.532.532 0 000-.751l-.044-.044a.53.53 0 00-.752 0L7.547 9.058 5.912 7.423z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Terms;
