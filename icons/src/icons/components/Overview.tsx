import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Overview = (allProps: IconProps) => {
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
					<mask id="prefix__a" fill="#fff">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M3 2a1 1 0 00-1 1v3.5a1 1 0 001 1h3.5a1 1 0 001-1V3a1 1 0 00-1-1H3zm0 6.5a1 1 0 00-1 1V13a1 1 0 001 1h3.5a1 1 0 001-1V9.5a1 1 0 00-1-1H3zM8.5 3a1 1 0 011-1H13a1 1 0 011 1v3.5a1 1 0 01-1 1H9.5a1 1 0 01-1-1V3zm1 5.5a1 1 0 00-1 1V13a1 1 0 001 1H13a1 1 0 001-1V9.5a1 1 0 00-1-1H9.5z"
						/>
					</mask>
					<path
						d="M3.2 3a.2.2 0 01-.2.2V.8A2.2 2.2 0 00.8 3h2.4zm0 3.5V3H.8v3.5h2.4zM3 6.3c.11 0 .2.09.2.2H.8A2.2 2.2 0 003 8.7V6.3zm3.5 0H3v2.4h3.5V6.3zm-.2.2c0-.11.09-.2.2-.2v2.4a2.2 2.2 0 002.2-2.2H6.3zm0-3.5v3.5h2.4V3H6.3zm.2.2a.2.2 0 01-.2-.2h2.4A2.2 2.2 0 006.5.8v2.4zM3 3.2h3.5V.8H3v2.4zm.2 6.3a.2.2 0 01-.2.2V7.3A2.2 2.2 0 00.8 9.5h2.4zm0 3.5V9.5H.8V13h2.4zm-.2-.2c.11 0 .2.09.2.2H.8A2.2 2.2 0 003 15.2v-2.4zm3.5 0H3v2.4h3.5v-2.4zm-.2.2c0-.11.09-.2.2-.2v2.4A2.2 2.2 0 008.7 13H6.3zm0-3.5V13h2.4V9.5H6.3zm.2.2a.2.2 0 01-.2-.2h2.4a2.2 2.2 0 00-2.2-2.2v2.4zM3 9.7h3.5V7.3H3v2.4zM9.5.8A2.2 2.2 0 007.3 3h2.4a.2.2 0 01-.2.2V.8zm3.5 0H9.5v2.4H13V.8zM15.2 3A2.2 2.2 0 0013 .8v2.4a.2.2 0 01-.2-.2h2.4zm0 3.5V3h-2.4v3.5h2.4zM13 8.7a2.2 2.2 0 002.2-2.2h-2.4c0-.11.09-.2.2-.2v2.4zm-3.5 0H13V6.3H9.5v2.4zM7.3 6.5a2.2 2.2 0 002.2 2.2V6.3c.11 0 .2.09.2.2H7.3zm0-3.5v3.5h2.4V3H7.3zm2.4 6.5a.2.2 0 01-.2.2V7.3a2.2 2.2 0 00-2.2 2.2h2.4zm0 3.5V9.5H7.3V13h2.4zm-.2-.2c.11 0 .2.09.2.2H7.3a2.2 2.2 0 002.2 2.2v-2.4zm3.5 0H9.5v2.4H13v-2.4zm-.2.2c0-.11.09-.2.2-.2v2.4a2.2 2.2 0 002.2-2.2h-2.4zm0-3.5V13h2.4V9.5h-2.4zm.2.2a.2.2 0 01-.2-.2h2.4A2.2 2.2 0 0013 7.3v2.4zm-3.5 0H13V7.3H9.5v2.4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						mask="url(#prefix__a)"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Overview;
