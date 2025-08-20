import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Autoconfirm = (allProps: IconProps) => {
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
						d="M16.39 10.345a.75.75 0 011.22.876l-3.75 5.216a.75.75 0 01-1.22 0l-.75-1.043-.04-.064a.75.75 0 011.212-.871l.047.06.141.195 3.14-4.37zm-2-2.783a.75.75 0 011.22.875l-5.5 7.653a.75.75 0 01-1.22 0l-2.5-3.479-.04-.064a.75.75 0 011.212-.871l.047.06 1.891 2.63 4.89-6.803z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						d="M19.25 6c0-.69-.56-1.25-1.25-1.25H6c-.69 0-1.25.56-1.25 1.25v12c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25V6zm1.5 12A2.75 2.75 0 0118 20.75H6A2.75 2.75 0 013.25 18V6A2.75 2.75 0 016 3.25h12A2.75 2.75 0 0120.75 6v12z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Autoconfirm;
