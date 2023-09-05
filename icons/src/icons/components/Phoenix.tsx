import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Phoenix = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_32760_21371)">
						<mask
							id="prefix__a"
							style={{
								maskType: 'luminance',
							}}
							maskUnits="userSpaceOnUse"
							x={2}
							y={1}
							width={12}
							height={14}
						>
							<path d="M13.78 1H2.22v14h11.56V1z" fill="#fff" />
						</mask>
						<g mask="url(#prefix__a)">
							<mask
								id="prefix__b"
								style={{
									maskType: 'luminance',
								}}
								maskUnits="userSpaceOnUse"
								x={2}
								y={0}
								width={12}
								height={16}
							>
								<path d="M13.793.96H2.219v14.06h11.574V.96z" fill="#fff" />
							</mask>
							<g
								mask="url(#prefix__b)"
								fill={allProps.color ? allProps.color : 'currentColor'}
							>
								<path d="M2.22.995l5.77 6.637L13.793.96l-2.992 2.233a4.69 4.69 0 01-5.596.01L2.219.996zM2.22 14.985l5.77-6.638 5.801 6.67-2.992-2.233a4.69 4.69 0 00-5.596-.01l-2.984 2.21z" />
							</g>
						</g>
					</g>
					<defs>
						<clipPath id="prefix__clip0_32760_21371">
							<path
								fill="#fff"
								transform="translate(2.22 1)"
								d="M0 0h11.561v14H0z"
							/>
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Phoenix;
