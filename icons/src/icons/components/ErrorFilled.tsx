import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const ErrorFilled = (allProps: IconProps) => {
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
						d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm4.03 5.97a.75.75 0 00-1.06 0L12 10.94 9.03 7.97l-.056-.052a.75.75 0 00-1.056 1.056l.052.056L10.94 12l-2.97 2.97a.75.75 0 001.06 1.06L12 13.06l2.97 2.97.056.052a.75.75 0 001.056-1.056l-.052-.056L13.06 12l2.97-2.97a.75.75 0 000-1.06z"
						fill="#FF887F"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default ErrorFilled;
