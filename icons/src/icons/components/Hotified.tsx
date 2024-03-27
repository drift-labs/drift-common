import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hotified = (allProps: IconProps) => {
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
						d="M18.405 10.598a7.386 7.386 0 00-1.648-2.446l-.579-.567a.15.15 0 00-.147-.038.158.158 0 00-.068.04.173.173 0 00-.043.068l-.259.792c-.161.497-.457 1.005-.877 1.504a.121.121 0 01-.082.042.106.106 0 01-.085-.032.13.13 0 01-.04-.102c.074-1.278-.284-2.72-1.068-4.29-.648-1.303-1.549-2.32-2.674-3.03l-.822-.516c-.107-.068-.244.022-.238.155l.043 1.02c.03.696-.045 1.312-.224 1.824a6.169 6.169 0 01-1.88 2.71 7.402 7.402 0 00-1.994 2.58A7.799 7.799 0 005 13.589a7.74 7.74 0 00.55 2.888 7.462 7.462 0 001.502 2.355 6.975 6.975 0 002.226 1.586A6.614 6.614 0 0012 21c.945 0 1.86-.195 2.722-.58a6.92 6.92 0 002.226-1.586 7.392 7.392 0 001.501-2.355A7.739 7.739 0 0019 13.59a7.735 7.735 0 00-.595-2.992z"
						fill="url(#prefix__paint0_linear_40_4498)"
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_40_4498"
							x1={12}
							y1={2}
							x2={12}
							y2={21}
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
