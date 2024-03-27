import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Open = (allProps: IconProps) => {
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
						d="M3.25 6A2.75 2.75 0 016 3.25h4a.75.75 0 010 1.5H6c-.69 0-1.25.56-1.25 1.25v12c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25v-4.4a.75.75 0 011.5 0V18A2.75 2.75 0 0118 20.75H6A2.75 2.75 0 013.25 18V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M20.042 3.982a.75.75 0 01-.024 1.06l-5.5 5.26a.75.75 0 01-1.036-1.084l5.5-5.26a.75.75 0 011.06.024z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13.375 4c0-.345.28-.625.625-.625h5.75c.483 0 .875.392.875.875v5.51a.625.625 0 11-1.25 0V4.625H14A.625.625 0 0113.375 4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Open;
