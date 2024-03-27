import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Settings = (allProps: IconProps) => {
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
						d="M17.961 15.24a1.35 1.35 0 01.094-.786 1.351 1.351 0 011.235-.818h.074a1.636 1.636 0 100-3.272h-.14a1.35 1.35 0 01-1.235-.819c-.183-.289-.138-.688-.093-.85a1.35 1.35 0 01.363-.704l.05-.05a1.638 1.638 0 10-2.316-2.315l-.05.05a1.35 1.35 0 01-1.489.27 1.35 1.35 0 01-.818-1.236v-.074a1.636 1.636 0 10-3.272 0v.14a1.35 1.35 0 01-.819 1.235H9.48a1.35 1.35 0 01-1.49-.27l-.048-.05a1.636 1.636 0 10-2.316 2.316l.05.05a1.35 1.35 0 01.27 1.488 1.35 1.35 0 01-1.236.884h-.074a1.636 1.636 0 100 3.273h.14a1.35 1.35 0 011.235.818 1.35 1.35 0 01-.27 1.49l-.05.048a1.636 1.636 0 102.316 2.316l.05-.05a1.35 1.35 0 011.488-.27 1.35 1.35 0 01.884 1.236v.074a1.636 1.636 0 103.273 0v-.14a1.35 1.35 0 01.818-1.235 1.35 1.35 0 011.49.27l.048.05a1.638 1.638 0 102.316-2.316l-.05-.05a1.35 1.35 0 01-.363-.702z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M12 15a3 3 0 100-6 3 3 0 000 6z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.5}
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
