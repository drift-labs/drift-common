import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CreditCard = (allProps: IconProps) => {
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
						d="M14 3.125H2A.875.875 0 001.125 4v8a.875.875 0 00.875.875h12a.875.875 0 00.875-.875V4A.875.875 0 0014 3.125zm-12 .75h12a.125.125 0 01.125.125v1.625H1.875V4A.125.125 0 012 3.875zm12 8.25H2A.125.125 0 011.875 12V6.375h12.25V12a.125.125 0 01-.125.125zM12.875 10.5a.375.375 0 01-.375.375h-2a.375.375 0 010-.75h2a.375.375 0 01.375.375zm-4 0a.375.375 0 01-.375.375h-1a.375.375 0 110-.75h1a.375.375 0 01.375.375z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CreditCard;
