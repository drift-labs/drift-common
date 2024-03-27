import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hamburger = (allProps: IconProps) => {
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
						d="M3.25 6A.75.75 0 014 5.25h16a.75.75 0 010 1.5H4A.75.75 0 013.25 6zm0 6a.75.75 0 01.75-.75h16a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75zm0 6a.75.75 0 01.75-.75h16a.75.75 0 010 1.5H4a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hamburger;
