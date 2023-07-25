import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ExitPosition = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12.227 4.596a.625.625 0 00-.954.808L13.05 7.5H6.375a.625.625 0 100 1.25h6.462l-1.564 1.846a.625.625 0 10.954.808l2.404-2.838a.875.875 0 000-1.132l-2.404-2.838z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M7.875 12v1.5a.5.5 0 01-.5.5H4a2 2 0 01-2-2V4a2 2 0 012-2h3.375a.5.5 0 01.5.5V4"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.25}
						strokeLinecap="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ExitPosition;
