import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bolt = (allProps: IconProps) => {
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
						d="M10.444 21a.713.713 0 01-.702-.836l1.052-5.991A1 1 0 009.809 13H6.791c-.3 0-.486-.067-.557-.2-.07-.133-.024-.317.136-.55l6.616-8.957a.722.722 0 011.295.536l-.905 6.022A1 1 0 0014.365 11h3.047c.3 0 .486.067.556.2.07.133.025.317-.135.55l-6.821 8.969a.713.713 0 01-.568.281z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bolt;
