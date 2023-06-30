import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trade = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_30649_36493)">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M4 5h2v6H3V5h1zm0-3.4V4H2.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5H4v2.4a.6.6 0 101.2 0V12h1.3a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5H5.2V1.6a.6.6 0 00-1.2 0zM11 6h2v3h-3V6h1zm0-4.4V5H9.5a.5.5 0 00-.5.5v4a.5.5 0 00.5.5H11v4.4a.6.6 0 101.2 0V10h1.3a.5.5 0 00.5-.5v-4a.5.5 0 00-.5-.5h-1.3V1.6a.6.6 0 10-1.2 0z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_30649_36493">
							<path fill="#fff" d="M0 0h16v16H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trade;
