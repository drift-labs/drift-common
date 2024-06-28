import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Smart = (allProps: IconProps) => {
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
						d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm6.3-2.7a.75.75 0 01.75-.75h.009a.75.75 0 010 1.5H9.3a.75.75 0 01-.75-.75zm5.4 0a.75.75 0 01.75-.75h.009a.75.75 0 010 1.5H14.7a.75.75 0 01-.75-.75zm-6 3.9a.75.75 0 011.048.148l.006.007.033.04a4.6 4.6 0 00.76.698c.536.39 1.285.757 2.203.757.918 0 1.667-.367 2.203-.757a4.6 4.6 0 00.76-.698 1.88 1.88 0 00.033-.04l.006-.008a.75.75 0 011.198.903l-.582-.437.582.438-.002.001-.002.003-.006.008-.018.023a4.992 4.992 0 01-.277.314c-.186.194-.458.45-.81.707-.702.51-1.753 1.043-3.085 1.043s-2.383-.533-3.085-1.043a6.104 6.104 0 01-1.027-.947 3.1 3.1 0 01-.06-.074l-.018-.023-.006-.008-.002-.003-.001-.001s-.001-.001.558-.42l-.559.419a.75.75 0 01.15-1.05zm7.052.148z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Smart;
