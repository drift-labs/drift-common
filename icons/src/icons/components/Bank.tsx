import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Bank = (allProps: IconProps) => {
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
						d="M7.946 2.038l5.905 3.18c.137.074.085.282-.071.282H1.97c-.156 0-.208-.208-.071-.282l5.905-3.18a.15.15 0 01.142 0zM14.166 13H1.582c-.052 0-.065-.071-.018-.095l.78-.39a.15.15 0 01.066-.015h10.93a.15.15 0 01.067.016l.779.39c.047.023.033.094-.02.094z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M3.5 6v6.5m0 0h9.84a.15.15 0 01.067.016l.779.39c.047.023.033.094-.02.094H1.582c-.052 0-.065-.071-.018-.095l.78-.39a.15.15 0 01.066-.015H3.5zm3-6.5v6.5m3-6.5v5.5m3-5.5v6.5M7.946 2.038l5.905 3.18c.137.074.085.282-.071.282H1.97c-.156 0-.208-.208-.071-.282l5.905-3.18a.15.15 0 01.142 0z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.15}
						strokeLinecap="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Bank;
