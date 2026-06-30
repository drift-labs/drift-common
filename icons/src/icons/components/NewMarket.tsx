import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const NewMarket = (allProps: IconProps) => {
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
						d="M9.98 21a.946.946 0 01-.922-1.157l1.059-4.62A1 1 0 009.142 14H4.785c-.401 0-.649-.067-.743-.2-.093-.133-.032-.317.181-.55l9.1-9.943a.946.946 0 011.62.85l-1.059 4.62A1 1 0 0014.86 10h4.357c.4 0 .648.067.74.2.095.133.035.317-.179.55l-9.099 9.943A.946.946 0 019.98 21z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default NewMarket;
