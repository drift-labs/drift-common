import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Loader = (allProps: IconProps) => {
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
					<circle
						cx={8}
						cy={8}
						r={5.917}
						stroke="url(#prefix__paint0_linear_30649_36394)"
						strokeWidth={1.5}
					/>
					<circle
						cx={8}
						cy={8}
						r={5.917}
						stroke="url(#prefix__paint1_linear_30649_36394)"
						strokeWidth={1.5}
					/>
					<circle
						cx={8}
						cy={8}
						r={5.917}
						stroke="url(#prefix__paint2_angular_30649_36394)"
						strokeOpacity={0.2}
						strokeWidth={1.5}
					/>
					<circle
						cx={8}
						cy={8}
						r={5.917}
						stroke="url(#prefix__paint3_angular_30649_36394)"
						strokeOpacity={0.1}
						strokeWidth={1.5}
					/>
					<circle
						cx={8}
						cy={8}
						r={5.917}
						stroke="url(#prefix__paint4_linear_30649_36394)"
						strokeOpacity={0.2}
						strokeWidth={1.5}
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_30649_36394"
							x1={1.111}
							y1={8}
							x2={14.445}
							y2={6.449}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#FF3873" />
							<stop offset={0.474} stopColor="#711EFF" />
							<stop offset={1} stopColor="#3FE5FF" />
						</linearGradient>
						<linearGradient
							id="prefix__paint1_linear_30649_36394"
							x1={2.16}
							y1={1.947}
							x2={9.412}
							y2={9.964}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#F6F063" />
							<stop offset={1} stopColor="#E07774" stopOpacity={0} />
						</linearGradient>
						<linearGradient
							id="prefix__paint4_linear_30649_36394"
							x1={2.86}
							y1={5.037}
							x2={9.31}
							y2={8}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#fff" />
							<stop offset={1} stopOpacity={0} />
						</linearGradient>
						<radialGradient
							id="prefix__paint2_angular_30649_36394"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="rotate(59.43 -4.432 4.486) scale(3.15876 3.15367)"
						>
							<stop offset={0.926} stopColor="#fff" />
							<stop offset={1} stopColor="#fff" stopOpacity={0} />
						</radialGradient>
						<radialGradient
							id="prefix__paint3_angular_30649_36394"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="matrix(1.27043 1.62504 -2.43948 1.90714 3.621 4.784)"
						>
							<stop offset={0.086} stopColor="#fff" />
							<stop offset={0.941} stopColor="#fff" stopOpacity={0} />
						</radialGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Loader;
