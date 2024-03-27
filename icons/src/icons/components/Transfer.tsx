import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Transfer = (allProps: IconProps) => {
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
						d="M3.47 17.03a.75.75 0 010-1.06l4-4a.75.75 0 011.06 1.06l-2.72 2.72H20a.75.75 0 010 1.5H5.81l2.72 2.72a.75.75 0 11-1.06 1.06l-4-4zM3.25 7.5A.75.75 0 014 6.75h14.19l-2.72-2.72a.75.75 0 011.06-1.06l4 4a.75.75 0 010 1.06l-4 4a.75.75 0 11-1.06-1.06l2.72-2.72H4a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Transfer;
