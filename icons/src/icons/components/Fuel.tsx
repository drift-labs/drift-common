import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Fuel = (allProps: IconProps) => {
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
						d="M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17zm0 1.5c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13.702 15.9c.414-.363.798-.991.798-2.117 0-.161-.061-.5-.261-1.037a14.66 14.66 0 00-.795-1.712 32.432 32.432 0 00-1.428-2.395 34.346 34.346 0 00-1.444 2.377c-.333.61-.612 1.191-.805 1.701-.202.534-.267.884-.267 1.066 0 1.126.384 1.754.798 2.117.45.396 1.079.6 1.702.6s1.252-.204 1.702-.6zM16 13.783C16 16.811 13.846 18 12 18s-4-1.189-4-4.217c0-1.8 2.207-5.178 3.418-6.942a.718.718 0 011.185-.014C13.847 8.607 16 12.065 16 13.783z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Fuel;
