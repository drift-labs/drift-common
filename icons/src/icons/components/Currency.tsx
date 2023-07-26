import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Currency = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_30649_36457)">
						<circle
							cx={8}
							cy={8}
							r={6.5}
							stroke={allProps.color ? allProps.color : 'currentColor'}
							strokeWidth={1.15}
						/>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M7.325 3c.318 0 .575.257.575.575V4.3h.6v-.725a.575.575 0 011.15 0V4.3h.815a.15.15 0 01.106.044l1.155 1.155a.15.15 0 01.044.106v.965a.15.15 0 01-.15.15h-1.196a.15.15 0 01-.15-.15v-.415a.15.15 0 00-.044-.106L9.8 5.62a.15.15 0 00-.105-.044H9.65v5.148h.045a.15.15 0 00.106-.044l.43-.429a.15.15 0 00.043-.106V9.73a.15.15 0 01.15-.15h1.196a.15.15 0 01.15.15v.965a.15.15 0 01-.044.106l-1.155 1.155a.15.15 0 01-.106.044H9.65v.425a.575.575 0 11-1.15 0V12h-.6v.425a.575.575 0 11-1.15 0V12h-.923a.15.15 0 01-.106-.044L4.544 10.78a.15.15 0 01-.044-.106V5.627a.15.15 0 01.044-.106L5.72 4.344a.15.15 0 01.106-.044h.923v-.725c0-.318.257-.575.575-.575zM8.5 10.724V5.576h-.6v5.148h.6zM6.62 5.576h.13v5.148h-.13a.15.15 0 01-.107-.044l-.473-.473a.15.15 0 01-.044-.106V6.199a.15.15 0 01.044-.106l.473-.473a.15.15 0 01.106-.044z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_30649_36457">
							<path fill="#fff" d="M0 0h16v16H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Currency;
