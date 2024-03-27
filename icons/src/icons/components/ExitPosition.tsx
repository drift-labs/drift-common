import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ExitPosition = (allProps: IconProps) => {
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
						d="M16.53 7.47a.75.75 0 10-1.06 1.06l2.72 2.72H9.257a.75.75 0 000 1.5h8.932l-2.72 2.72a.75.75 0 101.06 1.06l3.824-3.823a1 1 0 000-1.414L16.53 7.47z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M3.25 6A2.75 2.75 0 016 3.25h6a.75.75 0 010 1.5H6c-.69 0-1.25.56-1.25 1.25v12c0 .69.56 1.25 1.25 1.25h6a.75.75 0 010 1.5H6A2.75 2.75 0 013.25 18V6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ExitPosition;
