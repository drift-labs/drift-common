import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ToastInfo = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_3715_3308)">
						<path
							d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 10.8c-.497 0-1.2.483-1.2.98v6.6c0 .498.703.82 1.2.82s1.2-.403 1.2-.9v-6.52c0-.497-.703-.98-1.2-.98zM12 6a1.2 1.2 0 100 2.4A1.2 1.2 0 0012 6z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_3715_3308">
							<path fill="#fff" d="M0 0h24v24H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ToastInfo;
