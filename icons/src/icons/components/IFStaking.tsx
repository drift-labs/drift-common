import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const IFStaking = (allProps: IconProps) => {
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
						d="M20 5.5H4a.5.5 0 00-.5.5v12a.5.5 0 00.5.5h16a.5.5 0 00.5-.5V6a.5.5 0 00-.5-.5zM4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.47 7.47a.75.75 0 011.06 0l1.412 1.412c.576-.318 1.267-.454 2.023-.454.776 0 1.483.144 2.068.479L15.47 7.47a.75.75 0 111.06 1.06l-1.437 1.437c.335.585.48 1.292.48 2.068 0 .756-.137 1.447-.455 2.023l1.412 1.412a.75.75 0 11-1.06 1.06l-1.394-1.393c-.592.354-1.316.505-2.11.505-.776 0-1.483-.144-2.068-.48L8.53 16.53a.75.75 0 01-1.06-1.06l1.367-1.368c-.335-.585-.479-1.292-.479-2.067 0-.795.152-1.519.505-2.111L7.47 8.53a.75.75 0 010-1.06zm2.887 2.956c-.289.29-.499.78-.499 1.609 0 .828.21 1.319.499 1.608.289.289.78.499 1.608.499.828 0 1.32-.21 1.609-.499.289-.289.498-.78.498-1.608 0-.828-.21-1.32-.498-1.609-.29-.289-.78-.498-1.609-.498-.828 0-1.319.21-1.608.498z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default IFStaking;
