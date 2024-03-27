import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Percent = (allProps: IconProps) => {
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
						d="M12 19.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zm0 1.5a9 9 0 100-18 9 9 0 000 18z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M9.052 12.594c1.228 0 2.064-1.188 2.064-2.776C11.116 8.202 10.28 7 9.052 7 7.835 7 7 8.202 7 9.818c0 1.588.835 2.776 2.052 2.776zM10.206 17l4.449-10H13.5L9.052 17h1.154zm-1.154-5.539c-.578 0-.885-.621-.885-1.657s.307-1.671.885-1.671c.577 0 .896.635.896 1.67 0 1.037-.319 1.658-.896 1.658zM14.936 17C16.165 17 17 15.812 17 14.21s-.835-2.818-2.064-2.818c-1.216 0-2.052 1.216-2.052 2.818S13.72 17 14.936 17zm0-1.133c-.577 0-.884-.635-.884-1.67 0-1.037.307-1.658.884-1.658.578 0 .897.621.897 1.657s-.32 1.671-.897 1.671z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Percent;
