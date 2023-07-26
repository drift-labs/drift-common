import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Settings = (allProps: IconProps) => {
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
						d="M11.7 9.5a.825.825 0 00.165.91l.03.03a1.001 1.001 0 11-1.415 1.415l-.03-.03a.825.825 0 00-.91-.165.825.825 0 00-.5.755v.085a1 1 0 11-2 0v-.045a.825.825 0 00-.54-.755.825.825 0 00-.91.165l-.03.03a1 1 0 11-1.415-1.415l.03-.03a.825.825 0 00.165-.91.825.825 0 00-.755-.5H3.5a1 1 0 010-2h.045A.825.825 0 004.3 6.5a.825.825 0 00-.165-.91l-.03-.03A1 1 0 115.52 4.145l.03.03a.825.825 0 00.91.165h.04a.825.825 0 00.5-.755V3.5a1 1 0 012 0v.045a.825.825 0 00.5.755.825.825 0 00.91-.165l.03-.03a1 1 0 111.415 1.415l-.03.03a.825.825 0 00-.165.91v.04a.825.825 0 00.755.5h.085a1 1 0 110 2h-.045a.825.825 0 00-.755.5v0z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.8}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Settings;
