import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Percent = (allProps: IconProps) => {
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
					<circle
						cx={8}
						cy={8}
						r={5.9}
						stroke={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M5.77 8.4c.928 0 1.56-.8 1.56-1.867 0-1.085-.632-1.893-1.56-1.893-.919 0-1.55.808-1.55 1.893 0 1.068.631 1.866 1.55 1.866zm1.095 2.849L9.993 4.75h-.872L5.993 11.25h.872zM5.77 7.638c-.436 0-.668-.418-.668-1.114 0-.696.232-1.123.668-1.123.436 0 .678.427.678 1.123s-.242 1.114-.678 1.114zm4.446 3.722c.928 0 1.56-.798 1.56-1.875s-.632-1.893-1.56-1.893c-.919 0-1.55.816-1.55 1.893s.631 1.875 1.55 1.875zm0-.761c-.436 0-.668-.427-.668-1.123s.232-1.114.668-1.114c.436 0 .678.418.678 1.114 0 .696-.242 1.123-.678 1.123z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Percent;
