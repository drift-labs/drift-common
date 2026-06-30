import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Velocity = (allProps: IconProps) => {
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
						d="M9.684 6.108a.167.167 0 00.156.225h2.281c.108 0 .188.101.162.206l-1.447 5.933c-.042.172.176.282.29.147l5.217-6.226a.167.167 0 01.128-.06h3.346c.142 0 .22.168.126.276L6.707 22H5.465l2.82-11.794A.167.167 0 008.121 10H4.185a.167.167 0 01-.13-.272L10.368 2h.874L9.684 6.108z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Velocity;
