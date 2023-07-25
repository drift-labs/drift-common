import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GridMenu = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_32429_40601)">
						<path
							d="M6.364 5.272h3.272V2H6.364v3.272zM10.728 2v3.272H14V3a1 1 0 00-1-1h-2.272zM2 5.272h3.272V2H3a1 1 0 00-1 1v2.272zm4.364 4.364h3.272V6.364H6.364v3.272zm4.364 0H14V6.364h-3.272v3.272zM2 9.636h3.272V6.364H2v3.272zM6.364 14h3.272v-3.272H6.364V14zm4.364 0H13a1 1 0 001-1v-2.272h-3.272V14zM2 13a1 1 0 001 1h2.272v-3.272H2V13z"
							fill={allProps.color ? allProps.color : 'currentColor'}
						/>
					</g>
					<defs>
						<clipPath id="prefix__clip0_32429_40601">
							<path fill="#fff" transform="translate(2 2)" d="M0 0h12v12H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GridMenu;
