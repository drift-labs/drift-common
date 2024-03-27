import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Network = (allProps: IconProps) => {
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
						d="M10.4 4.75a.05.05 0 00-.05.05V8c0 .028.022.05.05.05h3.2a.05.05 0 00.05-.05V4.8a.05.05 0 00-.05-.05h-3.2zm2.35 4.8h.85A1.55 1.55 0 0015.15 8V4.8a1.55 1.55 0 00-1.55-1.55h-3.2A1.55 1.55 0 008.85 4.8V8c0 .856.694 1.55 1.55 1.55h.85v1.7H7.2a1.55 1.55 0 00-1.55 1.55v1.65H4.8A1.55 1.55 0 003.25 16v3.2c0 .856.694 1.55 1.55 1.55H8a1.55 1.55 0 001.55-1.55V16A1.55 1.55 0 008 14.45h-.85V12.8a.05.05 0 01.05-.05h9.6a.05.05 0 01.035.015.05.05 0 01.015.035v1.65H16A1.55 1.55 0 0014.45 16v3.2c0 .856.694 1.55 1.55 1.55h3.2a1.55 1.55 0 001.55-1.55V16a1.55 1.55 0 00-1.55-1.55h-.85V12.8a1.55 1.55 0 00-1.55-1.55h-4.05v-1.7zm3.25 6.4a.05.05 0 00-.05.05v3.2c0 .028.022.05.05.05h3.2a.05.05 0 00.05-.05V16a.05.05 0 00-.05-.05H16zm-11.2 0a.05.05 0 00-.05.05v3.2c0 .028.022.05.05.05H8a.05.05 0 00.05-.05V16a.05.05 0 00-.05-.05H4.8z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Network;
