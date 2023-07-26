import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Spot = (allProps: IconProps) => {
	const { svgProps: props, ...restProps } = allProps;
	return (
		<IconWrapper
			icon={
				<svg
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<path
						d="M12.974 3.99C11.678 3.342 9.958 3 8 3c-1.958 0-3.678.342-4.974.99C1.731 4.637 1 5.549 1 6.5v3c0 .951.739 1.866 2.026 2.51C4.314 12.654 6.042 13 8 13c1.958 0 3.678-.342 4.974-.99C14.269 11.363 15 10.451 15 9.5v-3c0-.951-.739-1.866-2.026-2.51zM8 4c3.915 0 6 1.452 6 2.5S11.915 9 8 9 2 7.548 2 6.5 4.085 4 8 4zm-.5 5.991v2c-1.188-.038-2.188-.213-3-.468V9.566c.98.26 1.987.403 3 .425zm1 0a12.715 12.715 0 003-.425v1.957c-.813.254-1.813.429-3 .468v-2zM2 9.5V8.346c.315.26.66.484 1.026.664.152.076.313.147.474.214v1.901C2.51 10.635 2 10.018 2 9.5zm10.5 1.625v-1.9c.163-.068.322-.14.474-.215A5.18 5.18 0 0014 8.346V9.5c0 .518-.51 1.135-1.5 1.625z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Spot;
