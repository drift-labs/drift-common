import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const FuelMini = (allProps: IconProps) => {
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
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M14.98 18.524c.723-.601 1.395-1.64 1.395-3.503 0-.268-.107-.829-.457-1.717-.333-.844-.816-1.813-1.39-2.834a53.134 53.134 0 00-2.5-3.964c-.83 1.193-1.74 2.57-2.527 3.935-.583 1.01-1.072 1.97-1.409 2.815-.353.883-.467 1.462-.467 1.765 0 1.863.672 2.902 1.396 3.503.788.655 1.888.993 2.979.993 1.09 0 2.19-.337 2.98-.993zM19 15.021C19 20.032 15.23 22 12 22s-7-1.968-7-6.98c0-2.98 3.862-8.57 5.981-11.49.502-.693 1.565-.712 2.074-.024C15.232 6.454 19 12.177 19 15.021z"
						fill="url(#prefix__paint0_radial_897_3263)"
					/>
					<defs>
						<radialGradient
							id="prefix__paint0_radial_897_3263"
							cx={0}
							cy={0}
							r={1}
							gradientTransform="matrix(-.64794 39.1355 -1153470 -16858.5 12.659 -2.676)"
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#132236" />
							<stop offset={0.41} stopColor="#F3ABFF" />
							<stop offset={0.622} stopColor="#69EBFF" />
							<stop offset={0.845} stopColor="#132236" />
						</radialGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default FuelMini;
