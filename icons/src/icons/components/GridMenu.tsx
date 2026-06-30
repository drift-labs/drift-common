import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GridMenu = (allProps: IconProps) => {
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
						d="M19.982 15.655V19c0 .543-.44.982-.982.982h-3.345v-4.327h4.327zm-11.637 0v4.327H5A.982.982 0 014.018 19v-3.345h4.327zm5.82 0v4.327h-4.33v-4.327h4.33zm5.817-5.82v4.33h-4.327v-4.33h4.327zm-5.818 0v4.33H9.836v-4.33h4.328zm-5.82 0v4.33H4.019v-4.33h4.327zM19 4.019c.543 0 .982.44.982.982v3.345h-4.327V4.018H19zm-4.836 0v4.327H9.836V4.018h4.328zM5 4.018h3.345v4.327H4.018V5c0-.543.44-.982.982-.982z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.035}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GridMenu;
