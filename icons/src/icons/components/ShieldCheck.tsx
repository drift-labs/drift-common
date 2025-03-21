import * as React from 'react';
import { GradientIconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Checkmark = (allProps: GradientIconProps & { color?: string }) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="none"
					{...props}
				>
					<path
						d="M8.30002 1.5C8.10002 1.5 7.90002 1.5 7.70002 1.5L3.40002 3.2C3.10002 3.3 2.90002 3.6 2.90002 4V8C2.90002 9.8 3.90002 11.3 5.00002 12.3C6.10002 13.4 7.20002 14.1 7.70002 14.3C7.90002 14.4 8.20002 14.4 8.50002 14.3C8.90002 14.1 10.1 13.4 11.2 12.3C12.3 11.2 13.3 9.8 13.3 8V4C13.3 3.6 13.1 3.3 12.8 3.2L8.30002 1.5ZM8.00002 9.3C7.70002 9.6 7.10002 9.6 6.80002 9.3L5.90002 8.3C5.70002 8.1 5.70002 7.8 5.90002 7.6C6.10002 7.4 6.40002 7.4 6.60002 7.6L7.40002 8.4L9.40002 6.4C9.60002 6.2 9.90002 6.2 10.1 6.4C10.3 6.6 10.3 6.9 10.1 7.1L8.00002 9.3Z"
						fill={restProps.color ? restProps.color : "url(#paint0_linear_1039_94918)"}
					/>
					{
						restProps.gradientColors && (
							<defs>
								<linearGradient
									id="paint0_linear_1039_94918"
									x1="2.90002"
									y1="7.9375"
									x2="13.3"
									y2="7.9375"
									gradientUnits="userSpaceOnUse"
								>
									<stop stop-color={restProps.gradientColors[0]} />
									<stop offset="0.5" stop-color={restProps.gradientColors[1]} />
									<stop offset="1" stop-color={restProps.gradientColors[2]} />
								</linearGradient>
							</defs>
						)
					}
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Checkmark;
