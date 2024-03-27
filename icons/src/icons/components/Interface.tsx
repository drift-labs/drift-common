import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Interface = (allProps: IconProps) => {
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
						d="M9.333 4H4.89A.889.889 0 004 4.889v6.222c0 .491.398.889.889.889h4.444c.491 0 .89-.398.89-.889V4.89A.889.889 0 009.332 4zM19.111 4h-4.444a.889.889 0 00-.89.889v2.667c0 .49.399.888.89.888h4.444c.491 0 .889-.398.889-.888V4.889A.889.889 0 0019.111 4zM19.111 12h-4.444a.889.889 0 00-.89.889v6.222c0 .491.399.889.89.889h4.444c.491 0 .889-.398.889-.889V12.89a.889.889 0 00-.889-.889zM9.333 15.556H4.89a.889.889 0 00-.889.888v2.667c0 .491.398.889.889.889h4.444c.491 0 .89-.398.89-.889v-2.667a.889.889 0 00-.89-.888z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Interface;
