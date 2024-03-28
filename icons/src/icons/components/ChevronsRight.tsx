import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ChevronsRight = (allProps: IconProps) => {
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
						d="M4.477 5.462a.75.75 0 011.06.015l5.834 6a.75.75 0 010 1.046l-5.833 6a.75.75 0 11-1.076-1.046L9.787 12 4.462 6.523a.75.75 0 01.015-1.06zm8.167 0a.75.75 0 011.06.015l5.834 6a.75.75 0 010 1.046l-5.834 6a.75.75 0 11-1.075-1.046L17.954 12l-5.325-5.477a.75.75 0 01.015-1.06z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ChevronsRight;
