import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Lightning = (allProps: IconProps) => {
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
						d="M6.667 14l.666-4.667H5c-.167 0-.27-.044-.309-.133-.038-.089-.013-.211.076-.367L8.667 2h.666l-.666 4.667H11c.167 0 .27.044.308.133.04.089.014.211-.075.367L7.333 14h-.666z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.12}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Lightning;
