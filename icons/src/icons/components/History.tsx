import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const History = (allProps: IconProps) => {
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
						d="M4.563 11.876a.812.812 0 00-.813.812.75.75 0 11-1.5 0 2.313 2.313 0 012.313-2.313H13a.75.75 0 010 1.5H4.563z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M4.563 2.5a.813.813 0 00-.813.813v9.375a.812.812 0 00.813.812h7.687v-11H4.563zm0-1.5H13a.75.75 0 01.75.75v12.5A.75.75 0 0113 15H4.563a2.312 2.312 0 01-2.313-2.312V3.313A2.313 2.313 0 014.563 1z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default History;
