import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Google = (allProps: IconProps) => {
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
						d="M12.163 4.6c1.8 0 3.336.568 4.568 1.517L15.25 7.571c-.886-.657-1.944-.989-3.087-.989-2.398 0-4.417 1.585-5.136 3.705A5.32 5.32 0 006.74 12c0 .598.106 1.175.288 1.712v0c.72 2.122 2.738 3.706 5.136 3.706 1.2 0 2.25-.311 3.089-.86h0a4.32 4.32 0 001.24-1.211 4.24 4.24 0 00.654-1.597l.132-.71h-4.514v-1.894h6.571c.041.335.065.68.065 1.036 0 2.286-.831 4.168-2.236 5.434v.001c-1.23 1.113-2.93 1.783-5 1.783l-.374-.008a7.702 7.702 0 01-2.525-.556A7.575 7.575 0 016.81 17.23a7.391 7.391 0 01-1.637-2.402 7.26 7.26 0 01.048-5.766l.181-.38a7.462 7.462 0 012.786-2.979A7.68 7.68 0 0111.9 4.604l.263-.004z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.2}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Google;
