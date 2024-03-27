import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Switch = (allProps: IconProps) => {
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
						d="M9 3.25a.75.75 0 01.75.75v15.882a.81.81 0 01-1.292.65l-4.905-3.644a.75.75 0 11.894-1.204l3.803 2.825V4A.75.75 0 019 3.25zM15 20.75a.75.75 0 01-.75-.75V4.118a.81.81 0 011.292-.65l4.905 3.644a.75.75 0 11-.894 1.204L15.75 5.491V20a.75.75 0 01-.75.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Switch;
