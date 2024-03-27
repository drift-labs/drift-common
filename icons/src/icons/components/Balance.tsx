import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Balance = (allProps: IconProps) => {
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
						d="M12 3.25a.75.75 0 01.75.75v1.304c1.73.792 4.043 1.502 5.55 1.502h1.8a.75.75 0 010 1.5h-1.05l2.651 6.983a.75.75 0 01-.256.87 5.294 5.294 0 01-6.29 0 .75.75 0 01-.256-.87l2.666-7.022c-1.503-.148-3.318-.702-4.815-1.327v12.31h3.75a.75.75 0 010 1.5h-9a.75.75 0 010-1.5h3.75V6.94c-1.497.625-3.312 1.18-4.815 1.327L9.1 15.29a.75.75 0 01-.256.87 5.294 5.294 0 01-6.29 0 .75.75 0 01-.256-.87L4.95 8.306H3.9a.75.75 0 010-1.5h1.8c1.507 0 3.82-.71 5.55-1.502V4a.75.75 0 01.75-.75zm-8.082 12a3.792 3.792 0 003.564 0L5.7 10.557 3.918 15.25zm12.6 0a3.792 3.792 0 003.564 0L18.3 10.557l-1.782 4.693z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Balance;
