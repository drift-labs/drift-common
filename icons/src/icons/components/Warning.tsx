import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Warning = (allProps: IconProps) => {
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
						d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-7.5 13a1 1 0 00-1 1v.5a1 1 0 001 1h1a1 1 0 001-1V17a1 1 0 00-1-1h-1zm-.357-11a1 1 0 00-.992 1.132l1.095 8.207a.761.761 0 001.509 0l1.095-8.207A1 1 0 0012.858 5h-1.715z"
						fill="#F2C94C"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Warning;
