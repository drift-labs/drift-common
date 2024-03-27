import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Help = (allProps: IconProps) => {
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
						d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm10.008-3.726a1.95 1.95 0 00-2.17 1.275.75.75 0 01-1.415-.498 3.45 3.45 0 016.705 1.15c0 1.297-.964 2.168-1.684 2.648a7.094 7.094 0 01-1.485.747l-.03.01-.009.004h-.003l-.001.001-.238-.71.237.71a.75.75 0 01-.476-1.422h.003l.015-.006.07-.026a5.6 5.6 0 001.085-.556c.63-.42 1.016-.9 1.016-1.4v-.002a1.95 1.95 0 00-1.62-1.925zM11.25 16.5a.75.75 0 01.75-.75h.009a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Help;
