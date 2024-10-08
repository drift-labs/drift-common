import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hot = (allProps: IconProps) => {
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
						d="M10.39 4.682a9.075 9.075 0 01-2.681 3.52 7.155 7.155 0 00-1.992 2.492A7.216 7.216 0 005 13.85c0 1.907.727 3.7 2.046 5.051A6.875 6.875 0 0012 21c1.873 0 3.63-.743 4.954-2.098A7.184 7.184 0 0019 13.851c0-.998-.2-1.968-.591-2.88l-.02-.045a7.066 7.066 0 00-.843-1.441c-.237.394-.52.781-.848 1.16a1.854 1.854 0 01-.568.442c-.216.106-.45.168-.69.18-.238.014-.478-.021-.704-.103a1.796 1.796 0 01-.611-.376 1.885 1.885 0 01-.47-.69 1.94 1.94 0 01-.132-.832c.074-1.207-.305-2.625-1.129-4.219a9.028 9.028 0 00-.322-.568A7.342 7.342 0 0010.886 3c-.06.404-.16.8-.298 1.184-.061.168-.127.335-.197.498zm.913 1.545c.57 1.228.768 2.206.723 2.946l-.723-2.946zm0 0a10.53 10.53 0 01-.974 1.46 10.25 10.25 0 01-1.69 1.69 5.656 5.656 0 00-1.57 1.966l-.001.004a5.716 5.716 0 00-.568 2.5v.004c0 1.518.576 2.934 1.619 4.003A5.376 5.376 0 0012 19.5a5.376 5.376 0 003.881-1.646A5.684 5.684 0 0017.5 13.85c0-.58-.084-1.147-.251-1.692a3.254 3.254 0 01-1.725.605 3.257 3.257 0 01-1.3-.19 3.298 3.298 0 01-1.121-.688 3.385 3.385 0 01-.843-1.237 3.439 3.439 0 01-.234-1.475"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hot;
