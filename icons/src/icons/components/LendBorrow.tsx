import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const LendBorrow = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_32_8272)">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M8.59 4.485a8.253 8.253 0 0111.104 4.53 3 3 0 000 5.97 8.253 8.253 0 01-11.104 4.53 3 3 0 00-4.105-4.105A8.217 8.217 0 013.75 12c0-1.217.263-2.371.735-3.41A3 3 0 008.59 4.485zM7.452 3.374A9.71 9.71 0 0112 2.25c4.446 0 8.195 2.975 9.369 7.042l-.048.014a3 3 0 01-.14 5.452l.159.048c-1.205 4.016-4.93 6.944-9.34 6.944a9.71 9.71 0 01-4.548-1.124 3 3 0 01-4.078-4.078A9.71 9.71 0 012.25 12a9.71 9.71 0 011.124-4.548 3 3 0 014.078-4.078zM7.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm14 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_32_8272">
							<path fill="#fff" d="M0 0h24v24H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default LendBorrow;
