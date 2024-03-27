import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Play = (allProps: IconProps) => {
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
						d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M10 8.934a.5.5 0 01.777-.416l4.599 3.066a.5.5 0 010 .832l-4.599 3.066a.5.5 0 01-.777-.416V8.934z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Play;
