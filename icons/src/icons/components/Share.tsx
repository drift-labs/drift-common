import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Share = (allProps: IconProps) => {
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
						d="M3.25 6A2.75 2.75 0 016 3.25h5a.75.75 0 010 1.5H6c-.69 0-1.25.56-1.25 1.25v12c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25v-5a.75.75 0 011.5 0v5A2.75 2.75 0 0118 20.75H6A2.75 2.75 0 013.25 18V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M16.345 3.47a.75.75 0 011.06 0l3.125 3.125a.75.75 0 010 1.06l-3.125 3.125a.75.75 0 11-1.06-1.06l1.844-1.845h-4.752a2.687 2.687 0 100 5.375h2.188a.75.75 0 010 1.5h-2.188a4.187 4.187 0 010-8.375h4.752L16.345 4.53a.75.75 0 010-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Share;
