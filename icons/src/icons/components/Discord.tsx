import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Discord = (allProps: IconProps) => {
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
						d="M18.942 5.34A15.91 15.91 0 0014.816 4c-.195.368-.372.746-.529 1.134a14.567 14.567 0 00-4.579 0A12.307 12.307 0 009.179 4 16.022 16.022 0 005.05 5.343C2.44 9.421 1.731 13.398 2.085 17.318c1.53 1.193 3.24 2.1 5.06 2.682.41-.582.773-1.199 1.084-1.845a10.518 10.518 0 01-1.706-.86c.143-.11.283-.222.418-.332A11.368 11.368 0 0012 18.156c1.749 0 3.476-.407 5.059-1.193.137.118.277.23.418.332-.545.34-1.117.628-1.71.862A12.91 12.91 0 0016.852 20a16.233 16.233 0 005.064-2.68c.415-4.546-.71-8.486-2.973-11.98zM8.678 14.907c-.987 0-1.802-.944-1.802-2.107 0-1.162.787-2.115 1.798-2.115 1.012 0 1.82.953 1.803 2.115-.017 1.163-.794 2.107-1.8 2.107zm6.644 0c-.988 0-1.8-.944-1.8-2.107 0-1.162.787-2.115 1.8-2.115s1.816.953 1.798 2.115c-.017 1.163-.793 2.107-1.798 2.107z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Discord;
