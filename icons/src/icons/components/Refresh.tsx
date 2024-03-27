import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Refresh = (allProps: IconProps) => {
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
						d="M3 5.4a.6.6 0 01.6.6v4.4H8a.6.6 0 110 1.2H3a.6.6 0 01-.6-.6V6a.6.6 0 01.6-.6zM15.4 14a.6.6 0 01.6-.6h5a.6.6 0 01.6.6v5a.6.6 0 11-1.2 0v-4.4H16a.6.6 0 01-.6-.6z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.746 4.576a7.982 7.982 0 014.052-.122A8.066 8.066 0 0117.4 6.34a8.26 8.26 0 012.255 3.414.75.75 0 11-1.417.492 6.76 6.76 0 00-1.845-2.794 6.566 6.566 0 00-2.932-1.535 6.482 6.482 0 00-3.29.099 6.586 6.586 0 00-2.84 1.709l-.004.005-3.296 3.3A.75.75 0 112.969 9.97l3.294-3.299a8.087 8.087 0 013.483-2.095zm11.284 9.393a.75.75 0 010 1.06l-3.291 3.298-.002.002a8.086 8.086 0 01-3.483 2.095 7.983 7.983 0 01-4.052.122A8.066 8.066 0 016.6 18.66a8.26 8.26 0 01-2.255-3.414.75.75 0 111.417-.492 6.76 6.76 0 001.845 2.794 6.566 6.566 0 002.932 1.535c1.087.25 2.22.217 3.29-.099a6.587 6.587 0 002.84-1.709l.004-.005 3.296-3.3a.75.75 0 011.06-.002z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Refresh;
