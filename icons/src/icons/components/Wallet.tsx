import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Wallet = (allProps: IconProps) => {
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
						d="M10.49 8.985a.5.5 0 000 1h1a.5.5 0 100-1h-1zm-7.5-4.5a.5.5 0 01.5-.5h8.775a.5.5 0 000-1H3.49a1.5 1.5 0 00-1.5 1.5v6a2.5 2.5 0 002.5 2.5h7.5a2 2 0 002-2v-4a2 2 0 00-2-2h-8.5a.5.5 0 01-.5-.5zm0 6V5.9c.156.055.325.085.5.085h8.5a1 1 0 011 1v4a1 1 0 01-1 1h-7.5a1.5 1.5 0 01-1.5-1.5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Wallet;
