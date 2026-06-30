import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CaretUp = (allProps: IconProps) => {
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
						d="M16.375 13.996h-8.75a.636.636 0 01-.437-.164.503.503 0 01-.184-.388c0-.149.062-.278.184-.387l4.375-3.889A.636.636 0 0112 9.004c.168 0 .314.055.437.164l4.374 3.889c.123.109.185.238.185.387 0 .15-.062.279-.184.388a.635.635 0 01-.437.164z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.009}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default CaretUp;
