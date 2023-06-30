import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Collapse = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					width="inherit"
					height="inherit"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M5.12 4.419l2.5 2.045a.6.6 0 00.76 0l2.5-2.045a.6.6 0 10-.76-.929L8.6 4.734V1.5a.6.6 0 00-1.2 0v3.234L5.88 3.49a.6.6 0 00-.76.929zM3 7.9a.6.6 0 01.6-.6h8.8a.6.6 0 110 1.2H3.6a.6.6 0 01-.6-.6zm2.12 3.681l2.5-2.045a.6.6 0 01.76 0l2.5 2.045a.6.6 0 11-.76.929L8.6 11.266V14.5a.6.6 0 11-1.2 0v-3.234L5.88 12.51a.6.6 0 11-.76-.929z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Collapse;
