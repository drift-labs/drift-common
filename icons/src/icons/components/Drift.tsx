import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Drift = (allProps: IconProps) => {
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
						d="M17.97 19.585c.385-.44.625-1.015.625-1.672V11.37c0-1.935-1.055-3.722-2.766-4.69L8.952 2.794 10.323 2l6.912 3.906C18.945 6.873 20 8.66 20 10.596v6.544c0 1.284-.92 2.257-2.044 2.515l.014-.07zm-1.933 1.117c.385-.44.625-1.015.625-1.671v-6.545c0-1.934-1.054-3.722-2.766-4.69L7.02 3.912l1.37-.794L15.3 7.023c1.712.967 2.766 2.755 2.766 4.69v6.544c0 1.285-.92 2.258-2.044 2.515l.014-.07zM6.405 5.876l.702.397v10.13l.033.018-.033.02 7.545 4.262a.53.53 0 01-.782.352l-7.465-4.218V5.876zm8.255 13.515l-6.402-3.618-.01.005v-8.86l.705.397v8.116l.073.04 5.634 3.184v.736zm0-1.925v-3.799c0-1.934-1.054-3.722-2.766-4.69l-1.888-1.066v6.925l4.654 2.63zm1.406 1.984c-.024 1.966-2.205 3.188-3.953 2.2L5.85 18.11 5 17.644V5.082l1.387-.804L13.3 8.184c1.712.967 2.766 2.755 2.766 4.69V19.45z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Drift;
