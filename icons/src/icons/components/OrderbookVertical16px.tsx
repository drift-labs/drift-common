import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const OrderbookVertical16px = (allProps: IconProps) => {
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
						d="M7 8.368H1.437A.438.438 0 001 8.806v2.072c0 .242.196.438.438.438h8.458a.437.437 0 00.437-.438V8.806a.437.437 0 00-.437-.438H7zm3 3.685H1.437A.438.438 0 001 12.49v2.072c0 .242.196.438.438.438h13.124a.438.438 0 00.438-.438V12.49a.438.438 0 00-.438-.437H10z"
						fill="#34CB88"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7 4.684H1.437A.438.438 0 001 5.122v2.072c0 .242.196.438.438.438h8.458a.437.437 0 00.437-.438V5.122a.437.437 0 00-.437-.438H7zM10 1H1.437A.438.438 0 001 1.438V3.51c0 .242.196.437.438.437h13.124A.438.438 0 0015 3.51V1.438A.438.438 0 0014.562 1H10z"
						fill="#FF887F"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default OrderbookVertical16px;
