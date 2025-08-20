import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const FuelFilled = (allProps: IconProps) => {
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
					<g clipPath="url(#prefix__clip0_537_3278)">
						<g
							clipPath="url(#prefix__clip1_537_3278)"
							fillRule="evenodd"
							clipRule="evenodd"
						>
							<path
								d="M12 22.2c5.633 0 10.2-4.567 10.2-10.2 0-5.633-4.567-10.2-10.2-10.2C6.367 1.8 1.8 6.367 1.8 12c0 5.633 4.567 10.2 10.2 10.2zm0 1.8c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
								fill="url(#prefix__paint0_radial_537_3278)"
							/>
							<path
								d="M14.043 16.68c.496-.436.957-1.19.957-2.54 0-.194-.073-.6-.314-1.245a17.599 17.599 0 00-.953-2.054 38.923 38.923 0 00-1.714-2.874 41.183 41.183 0 00-1.733 2.852c-.4.733-.734 1.43-.966 2.042-.242.64-.32 1.06-.32 1.28 0 1.35.46 2.103.957 2.54.54.474 1.295.719 2.043.719.748 0 1.502-.245 2.043-.72zm2.757-2.54c0 3.633-2.585 5.06-4.8 5.06-2.216 0-4.8-1.427-4.8-5.06 0-2.161 2.648-6.214 4.101-8.331a.86.86 0 011.422-.017c1.493 2.137 4.077 6.287 4.077 8.348z"
								fill="url(#prefix__paint1_radial_537_3278)"
							/>
						</g>
					</g>
					<defs>
						<radialGradient
							id="prefix__paint0_radial_537_3278"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="matrix(10.84945 9.1517 -366068.3366 433978.61922 12.007 12.563)"
						>
							<stop stopColor="#0AB8DF" />
							<stop offset={0.745} stopColor="#D867EA" />
							<stop offset={0.87} stopColor="#FDED5D" />
							<stop offset={1} stopColor="#00295F" />
						</radialGradient>
						<radialGradient
							id="prefix__paint1_radial_537_3278"
							cx={0}
							cy={0}
							r={1}
							gradientUnits="userSpaceOnUse"
							gradientTransform="matrix(-.44429 28.37332 -790946.03887 -12385.13005 12.451 1.31)"
						>
							<stop stopColor="#132236" />
							<stop offset={0.41} stopColor="#F3ABFF" />
							<stop offset={0.622} stopColor="#69EBFF" />
							<stop offset={0.845} stopColor="#132236" />
						</radialGradient>
						<clipPath id="prefix__clip0_537_3278">
							<path fill="#fff" d="M0 0h24v24H0z" />
						</clipPath>
						<clipPath id="prefix__clip1_537_3278">
							<path fill="#fff" d="M0 0h24v24H0z" />
						</clipPath>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default FuelFilled;
