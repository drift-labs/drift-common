import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const MouseClick = (allProps: IconProps) => {
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
						d="M9 9l5 12 1.8-5.2L21 14 9 9zM7.2 2.2L8 5.1l-.8-2.9zM5.1 8l-2.9-.8 2.9.8zM14 4.1L12 6l2-1.9zM6 12l-1.9 2L6 12z"
						fill="#000"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M7.067 1.718a.5.5 0 01.615.349l.8 2.9a.5.5 0 01-.964.266l-.8-2.9a.5.5 0 01.35-.615zm7.296 2.038a.5.5 0 01-.019.707l-2 1.9a.5.5 0 01-.688-.725l2-1.9a.5.5 0 01.707.018zM1.718 7.067a.5.5 0 01.615-.349l2.9.8a.5.5 0 11-.266.964l-2.9-.8a.5.5 0 01-.349-.615zm6.928 1.58a.5.5 0 01.546-.109l12 5a.5.5 0 01-.028.934l-4.97 1.721-1.721 4.97a.5.5 0 01-.934.03l-5-12a.5.5 0 01.107-.547zM9.93 9.928l4.028 9.667 1.37-3.96a.5.5 0 01.31-.308l3.96-1.371-9.668-4.028zm-3.585 1.708a.5.5 0 01.019.707l-1.9 2a.5.5 0 11-.725-.688l1.9-2a.5.5 0 01.706-.019z"
						fill="#fff"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default MouseClick;
