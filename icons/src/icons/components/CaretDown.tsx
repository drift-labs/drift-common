import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const CaretDown = (allProps: IconProps) => {
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
						d="M7.625 9.004h8.75c.168 0 .314.055.436.164.123.11.185.239.185.388 0 .149-.062.278-.184.387l-4.376 3.889a.635.635 0 01-.436.164.635.635 0 01-.437-.164L7.188 9.943a.504.504 0 01-.184-.387c0-.15.062-.279.184-.388a.636.636 0 01.437-.164z"
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
export default CaretDown;
