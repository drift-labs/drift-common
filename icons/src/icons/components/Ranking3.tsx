import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Ranking3 = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 32 32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<g filter="url(#prefix__filter0_d_3217_3401)">
						<path
							d="M18.31 28.388a4.663 4.663 0 01-4.62 0l-7.38-4.216A4.56 4.56 0 014 20.215v-8.43c0-1.633.88-3.141 2.31-3.957l7.38-4.216a4.663 4.663 0 014.62 0l7.38 4.216A4.56 4.56 0 0128 11.784v8.431a4.56 4.56 0 01-2.31 3.957l-7.38 4.216z"
							fill="url(#prefix__paint0_linear_3217_3401)"
						/>
					</g>
					<path
						d="M25.818 11.784c0-.854-.46-1.647-1.215-2.078L17.222 5.49a2.468 2.468 0 00-2.444 0l-7.38 4.216a2.396 2.396 0 00-1.216 2.078v8.432c0 .854.46 1.647 1.215 2.078l7.381 4.216a2.469 2.469 0 002.444 0l7.38-4.216a2.396 2.396 0 001.216-2.078v-8.432zM28 20.216l-.01.303a4.564 4.564 0 01-2.3 3.654l-7.38 4.215-.272.143a4.664 4.664 0 01-4.348-.143l-7.38-4.215a4.564 4.564 0 01-2.3-3.653L4 20.216v-8.432c0-1.53.773-2.952 2.048-3.796l.262-.16 7.38-4.216a4.663 4.663 0 014.62 0l7.38 4.215A4.56 4.56 0 0128 11.784v8.432z"
						fill="#fff"
						fillOpacity={0.4}
					/>
					<g filter="url(#prefix__filter1_d_3217_3401)">
						<path
							d="M16.119 21c-2.388 0-4.05-1.285-4.119-3.177h2.15c.07.857.796 1.395 1.955 1.395 1.019 0 1.69-.497 1.69-1.257 0-.732-.573-1.132-1.48-1.132h-1.132v-1.782h.88c.935 0 1.536-.428 1.536-1.119 0-.718-.587-1.146-1.48-1.146-1.02 0-1.662.538-1.732 1.436h-2.15C12.307 12.312 13.9 11 16.174 11c2.15 0 3.575 1.16 3.575 2.735 0 1.146-.866 1.81-1.745 2.044 1.186.235 1.996 1.16 1.996 2.307C20 19.867 18.352 21 16.119 21z"
							fill="#711EFF"
						/>
					</g>
					<defs>
						<filter
							id="prefix__filter0_d_3217_3401"
							x={4}
							y={3}
							width={24}
							height={27}
							filterUnits="userSpaceOnUse"
							colorInterpolationFilters="sRGB"
						>
							<feFlood floodOpacity={0} result="BackgroundImageFix" />
							<feColorMatrix
								in="SourceAlpha"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								result="hardAlpha"
							/>
							<feOffset dy={1} />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix values="0 0 0 0 0.254247 0 0 0 0 0 0 0 0 0 0.401442 0 0 0 1 0" />
							<feBlend
								in2="BackgroundImageFix"
								result="effect1_dropShadow_3217_3401"
							/>
							<feBlend
								in="SourceGraphic"
								in2="effect1_dropShadow_3217_3401"
								result="shape"
							/>
						</filter>
						<filter
							id="prefix__filter1_d_3217_3401"
							x={12}
							y={11}
							width={8.5}
							height={10.5}
							filterUnits="userSpaceOnUse"
							colorInterpolationFilters="sRGB"
						>
							<feFlood floodOpacity={0} result="BackgroundImageFix" />
							<feColorMatrix
								in="SourceAlpha"
								values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
								result="hardAlpha"
							/>
							<feOffset dx={0.5} dy={0.5} />
							<feComposite in2="hardAlpha" operator="out" />
							<feColorMatrix values="0 0 0 0 0.254902 0 0 0 0 0 0 0 0 0 0.4 0 0 0 1 0" />
							<feBlend
								in2="BackgroundImageFix"
								result="effect1_dropShadow_3217_3401"
							/>
							<feBlend
								in="SourceGraphic"
								in2="effect1_dropShadow_3217_3401"
								result="shape"
							/>
						</filter>
						<linearGradient
							id="prefix__paint0_linear_3217_3401"
							x1={16}
							y1={29.707}
							x2={16}
							y2={2.293}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#B58AFF" />
							<stop offset={1} stopColor="#F1E8FF" />
						</linearGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Ranking3;
