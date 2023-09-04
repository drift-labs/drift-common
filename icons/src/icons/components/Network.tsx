import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Network = (allProps: IconProps) => {
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
						d="M13.4 10.4H11a.6.6 0 00-.6.6v2.4a.6.6 0 00.6.6h2.4a.6.6 0 00.6-.6V11a.6.6 0 00-.6-.6zM5 10.4H2.6a.6.6 0 00-.6.6v2.4a.6.6 0 00.6.6H5a.6.6 0 00.6-.6V11a.6.6 0 00-.6-.6zM9.2 2H6.8a.6.6 0 00-.6.6V5a.6.6 0 00.6.6h2.4a.6.6 0 00.6-.6V2.6a.6.6 0 00-.6-.6zM3.8 10.4V8.6a.6.6 0 01.6-.6h7.2a.6.6 0 01.6.6v1.8M8 8V5.6"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Network;
