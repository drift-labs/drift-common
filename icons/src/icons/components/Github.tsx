import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Github = (allProps: IconProps) => {
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
					<path
						d="M8 1.333A6.667 6.667 0 001.333 8a6.685 6.685 0 004.56 6.333c.334.054.44-.153.44-.333v-1.127c-1.846.4-2.24-.893-2.24-.893-.306-.773-.74-.98-.74-.98-.606-.413.047-.4.047-.4.667.047 1.02.687 1.02.687C5 12.3 5.98 12 6.36 11.84c.06-.433.233-.727.42-.893-1.48-.167-3.033-.74-3.033-3.28 0-.74.253-1.334.686-1.807-.066-.167-.3-.86.067-1.76 0 0 .56-.18 1.833.68.527-.147 1.1-.22 1.667-.22s1.14.073 1.667.22C10.94 3.92 11.5 4.1 11.5 4.1c.367.9.133 1.593.067 1.76.433.473.686 1.067.686 1.807 0 2.546-1.56 3.106-3.046 3.273.24.207.46.613.46 1.233V14c0 .18.106.393.446.333A6.685 6.685 0 0014.667 8 6.667 6.667 0 008 1.333z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Github;
