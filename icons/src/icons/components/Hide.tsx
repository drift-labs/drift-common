import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hide = (allProps: IconProps) => {
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
						d="M13.25 4a.75.75 0 011.5 0v4.19l4.72-4.72a.75.75 0 111.06 1.06l-4.72 4.72H20a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75V4zM4 14.75a.75.75 0 010-1.5h6a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-4.19l-4.72 4.72a.75.75 0 01-1.06-1.06l4.72-4.72H4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hide;
