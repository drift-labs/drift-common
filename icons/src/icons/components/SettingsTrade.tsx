import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SettingsTrade = (allProps: IconProps) => {
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
						d="M3.5 3.25a.75.75 0 01.75.75v15.75H20.5a.75.75 0 010 1.5h-17a.75.75 0 01-.75-.75V4a.75.75 0 01.75-.75zm16.487 4.402a.75.75 0 01.084 1.057l-4.5 5.278a.75.75 0 01-1.122.022l-3.405-3.688-4.455 5.644a.75.75 0 01-1.178-.93l5-6.333a.75.75 0 011.14-.044l3.427 3.712 3.951-4.634a.75.75 0 011.058-.084z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SettingsTrade;
