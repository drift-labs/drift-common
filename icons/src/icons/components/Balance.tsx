import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Balance = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<g clipPath="url(#prefix__clip0_30649_36589)">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M9.237 3.987a1.757 1.757 0 01-.737.44V14h2.75a.5.5 0 010 1h-6.5a.5.5 0 010-1H7.5V4.427A1.757 1.757 0 016.323 3.25H3.5a.5.5 0 010-1h2.823a1.75 1.75 0 013.354 0H12.5a.5.5 0 010 1H9.677a1.757 1.757 0 01-.44.737zm-1.86-1.654a.75.75 0 101.247.834.75.75 0 00-1.248-.834zm-.877 7.89a.571.571 0 01-.149.384 3.885 3.885 0 01-2.855 1.269h-.013a3.885 3.885 0 01-2.85-1.25.5.5 0 01-.133-.339v-.34c0-.204.045-.405.132-.589l2.234-4.715a.25.25 0 01.226-.143h.816a.25.25 0 01.226.143l2.24 4.727c.083.176.126.369.126.564v.289zm-3.007.653A2.841 2.841 0 005.5 10.05v-.188l-2-4.222-2 4.223v.22a2.841 2.841 0 001.982.793h.01zM12.908 4.5a.25.25 0 01.226.143l2.24 4.727c.083.176.126.369.126.564v.289a.571.571 0 01-.149.384 3.885 3.885 0 01-2.855 1.269h-.013a3.885 3.885 0 01-2.85-1.25.5.5 0 01-.133-.339v-.34c0-.204.045-.405.132-.589l2.234-4.715a.25.25 0 01.226-.143h.816zm-.415 6.376a2.841 2.841 0 002.007-.826v-.188l-2-4.222-2 4.223v.22a2.841 2.841 0 001.982.793h.01z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_30649_36589">
							<path fill="#fff" d="M0 0h16v16H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Balance;
