import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Control = (allProps: IconProps) => {
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
						d="M7 4.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM3.25 7a3.75 3.75 0 017.425-.75H20a.75.75 0 010 1.5h-9.325A3.751 3.751 0 013.25 7zM17 14.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.675 1.5a3.751 3.751 0 017.425.75 3.75 3.75 0 01-7.425.75H4a.75.75 0 010-1.5h9.325z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Control;
