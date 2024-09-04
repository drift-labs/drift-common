import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const EyeShow = (allProps: IconProps) => {
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
						d="M4.012 12a11.49 11.49 0 001.77 2.372C7.133 15.758 9.165 17.1 12 17.1s4.867-1.343 6.218-2.728A11.496 11.496 0 0019.988 12a11.497 11.497 0 00-1.77-2.372C16.867 8.242 14.835 6.9 12 6.9S7.133 8.242 5.782 9.628A11.491 11.491 0 004.012 12zM21 12l.82-.37v-.001l-.001-.002-.003-.006-.008-.019a4.876 4.876 0 00-.14-.278 11.43 11.43 0 00-.425-.739 13.295 13.295 0 00-1.736-2.213C17.933 6.758 15.465 5.1 12 5.1S6.067 6.758 4.493 8.372a13.29 13.29 0 00-1.736 2.213 11.435 11.435 0 00-.535.955 4.789 4.789 0 00-.03.062l-.008.019-.003.006-.001.002c0 .001 0 .002.82.371l-.82-.37a.9.9 0 000 .74L3 12l-.82.37v.001l.001.002.003.006.008.019a4.789 4.789 0 00.14.278c.095.182.236.436.425.739.377.603.95 1.407 1.736 2.213C6.067 17.242 8.535 18.9 12 18.9s5.933-1.657 7.507-3.272a13.296 13.296 0 001.736-2.213 11.43 11.43 0 00.535-.955l.03-.062.008-.019.003-.006v-.002h.001c0-.001 0-.002-.82-.371zm0 0l.82.37a.9.9 0 000-.74L21 12zm-17.18-.37v-.001z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default EyeShow;
