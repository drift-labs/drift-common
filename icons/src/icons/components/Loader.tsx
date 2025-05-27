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
					<mask id="prefix__a" fill="#fff">
						<path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
					</mask>
					<path
						d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
						fill="url(#prefix__paint0_linear_53_6593)"
						mask="url(#prefix__a)"
					/>
					<path
						d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
						fill="url(#prefix__paint1_linear_53_6593)"
						mask="url(#prefix__a)"
					/>
					<g
						clipPath="url(#prefix__paint2_angular_53_6593_clip_path)"
						data-figma-skip-parse="true"
						mask="url(#prefix__a)"
					>
						<foreignObject
							x={-5314.19}
							y={-5314.19}
							width={10628.4}
							height={10628.4}
							transform="matrix(.00241 .00408 -.00407 .0024 2.527 9.03)"
						>
							<div
								style={{
									background:
										'conic-gradient(from 90deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,.2) 333.31deg,rgba(255,255,255,0) 360deg)',
									height: '100%',
									width: '100%',
								}}
							/>
						</foreignObject>
					</g>
					<path
						d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
						data-figma-gradient-fill='{"type":"GRADIENT_ANGULAR","stops":[{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.20000000298023224},"position":0.92586088180541992},{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.0},"position":1.0}],"stopsVar":[{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.20000000298023224},"position":0.92586088180541992},{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.0},"position":1.0}],"transform":{"m00":4.8196120262145996,"m01":-8.1459779739379883,"m02":4.1904721260070801,"m10":8.1591119766235352,"m11":4.8118529319763184,"m12":2.5450441837310791},"opacity":1.0,"blendMode":"NORMAL","visible":true}'
						mask="url(#prefix__a)"
					/>
					<g
						clipPath="url(#prefix__paint3_angular_53_6593_clip_path)"
						data-figma-skip-parse="true"
						mask="url(#prefix__a)"
					>
						<foreignObject
							x={-8433.7}
							y={-8433.7}
							width={16867.4}
							height={16867.4}
							transform="matrix(.0019 .00244 -.00366 .00286 5.432 7.176)"
						>
							<div
								style={{
									background:
										'conic-gradient(from 90deg,rgba(255,255,255,.0405) 0deg,rgba(255,255,255,.1) 31.113deg,rgba(255,255,255,0) 338.814deg,rgba(255,255,255,.0405) 360deg)',
									height: '100%',
									width: '100%',
								}}
							/>
						</foreignObject>
					</g>
					<path
						d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
						data-figma-gradient-fill='{"type":"GRADIENT_ANGULAR","stops":[{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.10000000149011612},"position":0.086425125598907471},{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.0},"position":0.94115048646926880}],"stopsVar":[{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.10000000149011612},"position":0.086425125598907471},{"color":{"r":1.0,"g":1.0,"b":1.0,"a":0.0},"position":0.94115048646926880}],"transform":{"m00":3.8112857341766357,"m01":-7.3184275627136230,"m02":7.1855783462524414,"m10":4.8751158714294434,"m11":5.7214269638061523,"m12":1.8774919509887695},"opacity":1.0,"blendMode":"NORMAL","visible":true}'
						mask="url(#prefix__a)"
					/>
					<path
						d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
						fill="url(#prefix__paint4_linear_53_6593)"
						mask="url(#prefix__a)"
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
						<clipPath id="prefix__paint2_angular_53_6593_clip_path">
							<path
								d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
								mask="url(#prefix__path-1-inside-1_53_6593)"
							/>
						</clipPath>
						<clipPath id="prefix__paint3_angular_53_6593_clip_path">
							<path
								d="M19 12a7 7 0 01-7 7v6c7.18 0 13-5.82 13-13h-6zm-7 7a7 7 0 01-7-7h-6c0 7.18 5.82 13 13 13v-6zm-7-7a7 7 0 017-7v-6C4.82-1-1 4.82-1 12h6zm7-7a7 7 0 017 7h6c0-7.18-5.82-13-13-13v6z"
								mask="url(#prefix__path-1-inside-1_53_6593)"
							/>
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Loader;
