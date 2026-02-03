import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Shield = (allProps: IconProps) => {
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
						d="M12.45 2.25h-.9L5.1 4.8c-.45.15-.75.6-.75 1.2v6c0 2.7 1.5 4.95 3.15 6.45 1.65 1.65 3.3 2.7 4.05 3 .3.15.75.15 1.2 0 .6-.3 2.4-1.35 4.05-3s3.15-3.75 3.15-6.45V6c0-.6-.3-1.05-.75-1.2l-6.75-2.55zM12 13.95c-.45.45-1.35.45-1.8 0l-1.35-1.5c-.3-.3-.3-.75 0-1.05.3-.3.75-.3 1.05 0l1.2 1.2 3-3c.3-.3.75-.3 1.05 0 .3.3.3.75 0 1.05L12 13.95z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Shield;
