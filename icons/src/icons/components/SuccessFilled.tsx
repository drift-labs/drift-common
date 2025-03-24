import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SuccessFilled = (allProps: IconProps) => {
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
						d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm5.197-12.97a.75.75 0 00-1.06-1.06l-5.887 5.886-2.386-2.386a.75.75 0 00-1.06 1.06l2.916 2.917a.75.75 0 001.06 0l6.417-6.417z"
						fill={restProps.color ?? '#5DD5A0'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SuccessFilled;
