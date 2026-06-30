import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SortUp = (allProps: IconProps) => {
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
						d="M7.625 14.004h8.75c.168 0 .314.055.436.164.123.11.185.239.185.388a.504.504 0 01-.184.387l-4.376 3.889a.635.635 0 01-.436.164.635.635 0 01-.437-.164l-4.375-3.889a.504.504 0 01-.184-.387c0-.15.062-.279.184-.388a.636.636 0 01.437-.164z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.009}
					/>
					<path
						d="M17 9.444c0 .15-.062.281-.186.391a.64.64 0 01-.439.165h-8.75a.64.64 0 01-.44-.165.507.507 0 01-.185-.39c0-.151.062-.281.186-.391l4.374-3.89A.64.64 0 0112 5a.64.64 0 01.44.165l4.374 3.889c.124.11.186.24.186.39z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SortUp;
