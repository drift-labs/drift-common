import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hotified = (allProps: IconProps) => {
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
					<path
						d="M13.033 7.327a5.43 5.43 0 00-1.295-1.8l-.455-.418a.126.126 0 00-.203.052l-.203.583c-.127.365-.36.739-.69 1.106a.098.098 0 01-.064.031.086.086 0 01-.067-.023.092.092 0 01-.031-.075c.058-.94-.223-2.002-.84-3.156-.508-.96-1.216-1.708-2.1-2.23l-.646-.38a.125.125 0 00-.187.114l.034.75c.023.513-.036.966-.177 1.342-.171.461-.418.89-.734 1.274a4.62 4.62 0 01-.742.72 5.51 5.51 0 00-1.567 1.899 5.434 5.434 0 00-.133 4.536 5.489 5.489 0 002.928 2.9A5.498 5.498 0 008 14.98c.742 0 1.46-.144 2.14-.427a5.447 5.447 0 001.747-1.167A5.409 5.409 0 0013.5 9.528c0-.762-.156-1.503-.467-2.201z"
						fill="url(#prefix__paint0_linear_32267_40555)"
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_32267_40555"
							x1={8}
							y1={1}
							x2={8}
							y2={14.98}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#DB5101" />
							<stop offset={1} stopColor="#FFD408" />
						</linearGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hotified;
