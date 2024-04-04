import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const PointsGradient = (allProps: IconProps) => {
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
					<defs>
						<linearGradient
							id="icon-points-gradient"
							x1="1.2"
							y1="0"
							x2="0"
							y2="0"
						>
							<stop offset="4.45%" stopColor="#ff2897" />
							<stop offset="59.61%" stopColor="#8e67ff" />
							<stop offset="91.15%" stopColor="#007bff" />
							<stop offset="123.21%" stopColor="#8bc3ff" />
						</linearGradient>
					</defs>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M16.5 13.747l-.445 1.018a2.5 2.5 0 01-1.29 1.29l-1.018.445 1.018.445a2.5 2.5 0 011.29 1.29l.445 1.018.445-1.018a2.5 2.5 0 011.29-1.29l1.018-.445-1.018-.445a2.5 2.5 0 01-1.29-1.29l-.445-1.018zm.916-1.65c-.349-.8-1.483-.8-1.832 0l-.903 2.068a1 1 0 01-.516.516l-2.068.903c-.8.349-.8 1.483 0 1.832l2.068.904a1 1 0 01.516.515l.903 2.068c.349.8 1.483.8 1.832 0l.904-2.067a1 1 0 01.515-.516l2.068-.904c.8-.349.8-1.483 0-1.832l-2.067-.903a1 1 0 01-.516-.516l-.904-2.068zM9.5 5.35L8.784 7.3a2.5 2.5 0 01-1.485 1.484L5.35 9.5l1.95.716a2.5 2.5 0 011.485 1.485l.716 1.95.716-1.95a2.5 2.5 0 011.485-1.485l1.95-.716-1.95-.716a2.5 2.5 0 01-1.485-1.485L9.5 5.35zm.939-1.795c-.321-.874-1.557-.874-1.878 0L7.376 6.782a1 1 0 01-.594.594L3.555 8.56c-.874.321-.874 1.557 0 1.878l3.227 1.185a1 1 0 01.594.594l1.185 3.227c.321.874 1.557.874 1.878 0l1.185-3.227a1 1 0 01.594-.594l3.227-1.185c.874-.321.874-1.557 0-1.878l-3.227-1.185a1 1 0 01-.594-.594L10.44 3.555z"
						fill={
							allProps.color ? allProps.color : 'url(#icon-points-gradient)'
						}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default PointsGradient;
