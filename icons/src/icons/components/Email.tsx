import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Email = (allProps: IconProps) => {
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
						d="M4.8 5.75c-.6 0-1.05.467-1.05 1v.457l7.715 4.766a1.033 1.033 0 001.07 0l.002-.001 7.713-4.765V6.75c0-.533-.45-1-1.05-1H4.8zm16.95 1.862V6.75c0-1.4-1.162-2.5-2.55-2.5H4.8c-1.388 0-2.55 1.1-2.55 2.5v10.5c0 1.4 1.162 2.5 2.55 2.5h14.4c1.388 0 2.55-1.1 2.55-2.5V7.637v-.025zm-1.5 1.358l-6.933 4.283a2.532 2.532 0 01-2.634 0l-.004-.002L3.75 8.97v8.28c0 .532.45 1 1.05 1h14.4c.6 0 1.05-.468 1.05-1V8.97z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Email;
