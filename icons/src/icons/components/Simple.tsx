import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Simple = (allProps: IconProps) => {
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
						d="M10.734 2.593a2.51 2.51 0 012.532 0h.001l6.223 3.601c.384.225.702.547.923.934.22.387.337.825.337 1.27v7.201c0 .446-.116.884-.337 1.271-.221.387-.54.71-.923.934l-.003.002-6.22 3.598-.001.001a2.51 2.51 0 01-2.532 0h-.001l-6.22-3.6-.003-.001a2.539 2.539 0 01-.923-.934 2.567 2.567 0 01-.337-1.27V8.4c0-.446.117-.884.337-1.271.221-.387.54-.71.923-.934l.003-.002 6.221-3.6zM12.75 19.97l5.983-3.462h.001a1.04 1.04 0 00.376-.382c.091-.16.14-.342.14-.528V8.648l-6.5 3.782v7.54zM12 11.13l6.495-3.78L12.51 3.89a1.011 1.011 0 00-1.02 0l-.003.001-5.982 3.462L12 11.132zM4.75 8.648v6.95c0 .187.049.369.14.529.091.159.221.29.376.381l.001.001 5.983 3.462v-7.54l-6.5-3.783z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Simple;
