import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ToastWarning = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_3721_8808)">
						<path
							d="M21 0a3 3 0 013 3v18a3 3 0 01-3 3H3a3 3 0 01-3-3V3a3 3 0 013-3h18zM11 17.334a1 1 0 00-1 1v1.333a1 1 0 001 1h2a1 1 0 001-1v-1.333a1 1 0 00-1-1h-2zm-.524-14.667a1 1 0 00-.992 1.132l1.511 11.334a1 1 0 00.991.867h.027a1 1 0 00.99-.867l1.513-11.334a1 1 0 00-.992-1.132h-3.048z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_3721_8808">
							<path fill="#fff" d="M0 0h24v24H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ToastWarning;
