import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Trash = (allProps: IconProps) => {
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
						d="M9.406 5.65h5.188c-.016-.178-.114-.399-.305-.593-.21-.213-.446-.307-.616-.307h-3.346c-.17 0-.406.094-.616.307-.19.194-.29.415-.305.593zm6.69 0c-.016-.645-.33-1.23-.738-1.645-.418-.424-1.018-.755-1.685-.755h-3.346c-.667 0-1.267.33-1.685.755-.408.415-.722 1-.738 1.645H4a.75.75 0 000 1.5h1.45l.885 11.183c.01.652.327 1.244.738 1.662.418.424 1.019.755 1.685.755h6.484c.666 0 1.267-.33 1.685-.755.411-.418.727-1.01.738-1.662l.884-11.183H20a.75.75 0 000-1.5h-2.137a.77.77 0 00-.015 0h-1.752zm-9.14 1.5l.877 11.09.002.06c0 .185.098.43.307.643.21.213.446.307.616.307h6.484c.17 0 .406-.094.616-.307.209-.213.307-.458.307-.643 0-.02 0-.04.002-.06l.877-11.09H6.955zm3.37 2.75a.75.75 0 01.75.75v5.1a.75.75 0 01-1.5 0v-5.1a.75.75 0 01.75-.75zm3.347 0a.75.75 0 01.75.75v5.1a.75.75 0 01-1.5 0v-5.1a.75.75 0 01.75-.75z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Trash;
