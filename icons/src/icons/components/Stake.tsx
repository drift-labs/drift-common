import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Stake = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M.905 2.5c0-.88.714-1.595 1.595-1.595h11c.88 0 1.595.714 1.595 1.595v10c0 .88-.714 1.595-1.595 1.595h-.81v.31a.595.595 0 01-1.19 0v-.31H4.69v.31a.595.595 0 01-1.19 0v-.31h-1c-.88 0-1.595-.714-1.595-1.595v-10zM2.5 2.095a.405.405 0 00-.405.405v10c0 .224.181.405.405.405h11a.405.405 0 00.405-.405v-10a.405.405 0 00-.405-.405h-11zm8 4a1.405 1.405 0 100 2.81 1.405 1.405 0 000-2.81zM7.905 7.5a2.595 2.595 0 115.19 0 2.595 2.595 0 01-5.19 0zM4.69 6.095a.595.595 0 10-1.19 0v2.81a.595.595 0 101.19 0v-2.81z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Stake;
