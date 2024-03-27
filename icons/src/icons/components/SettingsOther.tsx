import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const SettingsOther = (allProps: IconProps) => {
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
						d="M9.665 19.75L7.5 16l-2.165 3.75h4.33zm-1.732-6a.5.5 0 00-.866 0L3.17 20.5a.5.5 0 00.433.75h7.794a.5.5 0 00.433-.75l-3.897-6.75zM16 18.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 1.5a5 5 0 100-10 5 5 0 000 10z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M5 4.75a.25.25 0 00-.25.25v10a.75.75 0 01-1.5 0V5c0-.966.784-1.75 1.75-1.75h14c.966 0 1.75.784 1.75 1.75v4.5a.75.75 0 01-1.5 0V5a.25.25 0 00-.25-.25H5z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default SettingsOther;
