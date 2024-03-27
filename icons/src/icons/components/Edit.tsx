import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Edit = (allProps: IconProps) => {
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
						d="M17.457 3.22a1.25 1.25 0 00-1.768 0L4.049 14.858a1.25 1.25 0 00-.341.639l-.832 4.158a1.25 1.25 0 001.47 1.47l4.159-.831a1.25 1.25 0 00.638-.342l11.64-11.64a1.25 1.25 0 000-1.767l-3.326-3.327zm-2.344 2.697l1.46-1.46 2.973 2.973-1.46 1.46-2.973-2.973zm-1.061 1.06l-8.888 8.89-.744 3.715 3.716-.743 8.889-8.889-2.973-2.972z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Edit;
