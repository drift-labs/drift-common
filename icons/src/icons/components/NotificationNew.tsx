import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const NotificationNew = (allProps: IconProps) => {
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
						d="M12.836 8.524V7.276h-.965v1.448c0 .128.05.25.141.341l1.307 1.307v.766H2.699v-.766l1.306-1.307a.483.483 0 00.142-.34V6.792a3.855 3.855 0 015.793-3.34V2.374A4.777 4.777 0 008.49 1.99V1h-.965v.99A4.834 4.834 0 003.18 6.793v1.731L1.874 9.831a.483.483 0 00-.141.341v1.449a.483.483 0 00.483.482h3.379v.483a2.414 2.414 0 004.827 0v-.483h3.38a.483.483 0 00.482-.482v-1.449c0-.128-.05-.25-.141-.34l-1.307-1.308zm-3.38 4.062a1.448 1.448 0 01-2.896 0v-.483h2.897v.483z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M12.836 6.31a1.931 1.931 0 100-3.862 1.931 1.931 0 000 3.862z"
						fill="url(#prefix__paint0_linear_32648_42204)"
					/>
					<defs>
						<linearGradient
							id="prefix__paint0_linear_32648_42204"
							x1={10.905}
							y1={4.379}
							x2={14.767}
							y2={4.379}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#E54D48" />
							<stop offset={1} stopColor="#C94641" />
						</linearGradient>
					</defs>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default NotificationNew;
