import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Layout = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M2.667 3.5a.167.167 0 00-.167.167V5.5h11V3.667a.167.167 0 00-.167-.167H2.667zM2.5 12.333V6.5h3v6H2.667a.167.167 0 01-.167-.167zm4 .167h6.833a.167.167 0 00.167-.167V6.5h-7v6zm-5-8.833c0-.645.522-1.167 1.167-1.167h10.666c.645 0 1.167.522 1.167 1.167v8.666c0 .645-.522 1.167-1.167 1.167H2.667A1.167 1.167 0 011.5 12.333V3.667z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Layout;
