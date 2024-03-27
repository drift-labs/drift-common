import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bankrupt = (allProps: IconProps) => {
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
						d="M12 3.75c-4.597 0-8.25 3.51-8.25 7.75 0 2.667 1.436 5.035 3.65 6.435a.75.75 0 01.35.634V21c0 .138.112.25.25.25h8a.25.25 0 00.25-.25v-2.431a.75.75 0 01.35-.634c2.214-1.4 3.65-3.768 3.65-6.435 0-4.24-3.653-7.75-8.25-7.75zM2.25 11.5c0-5.148 4.406-9.25 9.75-9.25s9.75 4.102 9.75 9.25c0 3.081-1.586 5.796-4 7.471V21A1.75 1.75 0 0116 22.75H8A1.75 1.75 0 016.25 21v-2.029c-2.414-1.675-4-4.39-4-7.471z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M8.5 14.5a1 1 0 100-2 1 1 0 000 2zm0 1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15.5 14.5a1 1 0 100-2 1 1 0 000 2zm0 1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 18.25a.75.75 0 01.75.75v2.75h-1.5V19a.75.75 0 01.75-.75zM14 18.25a.75.75 0 01.75.75v2.75h-1.5V19a.75.75 0 01.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bankrupt;
