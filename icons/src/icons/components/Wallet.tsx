import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Wallet = (allProps: IconProps) => {
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
						d="M5 5.75A1.25 1.25 0 003.75 7v.75H19a2.75 2.75 0 012.75 2.75V17A2.75 2.75 0 0119 19.75H5A2.75 2.75 0 012.25 17V7A2.75 2.75 0 015 4.25h14a.75.75 0 010 1.5H5zm-1.25 3.5V17A1.25 1.25 0 005 18.25h14A1.25 1.25 0 0020.25 17v-6.5A1.25 1.25 0 0019 9.25H3.75zM14.25 14a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Wallet;
