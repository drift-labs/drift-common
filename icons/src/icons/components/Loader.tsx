import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Loader = (allProps: IconProps) => {
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
					<circle
						cx={12}
						cy={12}
						r={8.5}
						stroke="url(#prefix__paint0_linear_53_6593)"
						strokeWidth={3}
					/>
					<circle
						cx={12}
						cy={12}
						r={8.5}
						stroke="url(#prefix__paint1_linear_53_6593)"
						strokeWidth={3}
					/>
					<circle
						cx={12}
						cy={12}
						r={8.5}
						stroke="url(#prefix__paint2_angular_53_6593)"
						strokeWidth={3}
					/>
					<circle
						cx={12}
						cy={12}
						r={8.5}
						stroke="url(#prefix__paint3_angular_53_6593)"
						strokeWidth={3}
					/>
					<circle
						cx={12}
						cy={12}
						r={8.5}
						stroke="url(#prefix__paint4_linear_53_6593)"
						strokeWidth={3}
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_53_6593"
							x1={1.667}
							y1={12}
							x2={21.667}
							y2={9.673}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#FF3873" />
							<stop offset={0.474} stopColor="#711EFF" />
							<stop offset={1} stopColor="#3FE5FF" />
						</linearGradient>
						<linearGradient
							id="prefix__paint1_linear_53_6593"
							x1={3.24}
							y1={2.92}
							x2={14.118}
							y2={14.946}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#F6F063" />
							<stop offset={1} stopColor="#E07774" stopOpacity={0} />
						</linearGradient>
						<linearGradient
							id="prefix__paint4_linear_53_6593"
							x1={4.29}
							y1={7.555}
							x2={13.966}
							y2={12}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#fff" stopOpacity={0.2} />
							<stop offset={1} stopOpacity={0} />
						</linearGradient>
						<radialGradient
							id="prefix__paint2_angular_53_6593"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="matrix(2.4098 4.07956 -4.07299 2.40593 2.527 9.03)"
						>
							<stop offset={0.926} stopColor="#fff" stopOpacity={0.2} />
							<stop offset={1} stopColor="#fff" stopOpacity={0} />
						</radialGradient>
						<radialGradient
							id="prefix__paint3_angular_53_6593"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="rotate(51.982 -4.643 9.159) scale(3.09405 4.64473)"
						>
							<stop offset={0.086} stopColor="#fff" stopOpacity={0.1} />
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
