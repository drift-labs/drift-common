import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PreLaunch = (allProps: IconProps) => {
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
						d="M17.011 11.734l-.916 2.176c4.366 2.695 2.433 7.09 2.433 7.09l-4.087-3.156H9.45L5.71 21s-2.279-4.395 2.086-7.09l-.915-2.176a5.628 5.628 0 01-.22-3.088 6.088 6.088 0 011.465-2.824l3.23-3.573c.07-.078.16-.14.262-.183a.847.847 0 01.656 0 .738.738 0 01.262.183l3.23 3.573a6.088 6.088 0 011.465 2.824 5.628 5.628 0 01-.22 3.088zM12 12a2 2 0 110-4 2 2 0 010 4zm-.179 9.642a.2.2 0 00.358 0l1.176-2.353a.2.2 0 00-.179-.289h-2.352a.2.2 0 00-.18.29l1.177 2.352z"
						fill="url(#prefix__paint0_linear_433_3278)"
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_433_3278"
							x1={9.44}
							y1={2}
							x2={3.02}
							y2={19.667}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#9848FF" />
							<stop offset={1} stopColor="#FF08D7" />
						</linearGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PreLaunch;
