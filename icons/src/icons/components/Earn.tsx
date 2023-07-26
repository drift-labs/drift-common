import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Earn = (allProps: IconProps) => {
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
						d="M7.647 2.375c.124-.156.255-.2.353-.2.097 0 .229.044.354.2l.008.01 4.166 4.966c.274.349.274.95 0 1.298L8.36 13.642l-.007.01c-.125.155-.256.199-.354.199-.097 0-.229-.044-.354-.2l-.007-.01L3.473 8.65c-.275-.348-.275-.95 0-1.298l4.165-4.965.009-.011zM8 .975c.495 0 .957.237 1.286.644l4.166 4.967.005.006.004.005c.63.787.63 2.019 0 2.806l-.008.01-4.167 4.993c-.328.408-.79.645-1.286.645-.495 0-.957-.237-1.286-.645L2.547 9.412l-.008-.01c-.63-.786-.63-2.018 0-2.805l.004-.005.005-.006L6.714 1.62c.329-.407.79-.644 1.286-.644zm3.712 1.313a.3.3 0 000 .424l.99.99a.3.3 0 00.424 0l.99-.99a.3.3 0 000-.424l-.99-.99a.3.3 0 00-.424 0l-.99.99z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Earn;
