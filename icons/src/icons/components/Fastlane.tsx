import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Fastlane = (allProps: IconProps) => {
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
						d="M6.873 21.03c-.153.17-.425-.01-.33-.217l3.77-8.247A.4.4 0 009.948 12H6.656a.4.4 0 01-.356-.583l4.731-9.2A.4.4 0 0111.387 2h5.386a.4.4 0 01.356.583l-2.83 5.5a.4.4 0 00.357.584h2.446a.4.4 0 01.297.667L6.873 21.03z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Fastlane;
