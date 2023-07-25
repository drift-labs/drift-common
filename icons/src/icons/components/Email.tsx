import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Email = (allProps: IconProps) => {
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
						fillRule="evenodd"
						clipRule="evenodd"
						d="M2.333 2.733a.933.933 0 00-.933.934v8.666c0 .516.418.934.933.934h11.334a.933.933 0 00.933-.934V3.667a.933.933 0 00-.933-.934H2.333zm.267 2.37v6.964h10.8V5.139L8.694 8.37a.933.933 0 01-1.036.014L2.6 5.103zm10.437-1.17H3L8.162 7.28l4.875-3.346z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Email;
