import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GasPaymaster = (allProps: IconProps) => {
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
						d="M3.14 19.2V4.8a2.55 2.55 0 012.55-2.55h7.65l.147.015a.75.75 0 01.384.205l3.15 3.15.051.057a.75.75 0 01-1.055 1.054l-.057-.05-2.93-2.931H5.69A1.05 1.05 0 004.64 4.8v14.4l.005.104a1.05 1.05 0 001.045.946h10.8a1.052 1.052 0 001.05-1.05v-.45a.75.75 0 011.5 0v.45a2.55 2.55 0 01-2.55 2.55H5.69a2.55 2.55 0 01-2.537-2.298L3.14 19.2zm5.25-2.55l.078.004a.75.75 0 010 1.492l-.078.004h-.9a.75.75 0 010-1.5h.9zm10.964-5.575a1.16 1.16 0 00-.257-.62l-.077-.085a1.16 1.16 0 00-1.554-.077l-.085.077-3.814 3.813-.547 2.186 2.187-.547 3.813-3.812.077-.085a1.16 1.16 0 00.262-.735l-.005-.115zm1.492.378a2.66 2.66 0 01-.588 1.422l-.177.195-3.96 3.96a.75.75 0 01-.349.197l-3.6.9a.751.751 0 01-.91-.91l.9-3.599.032-.097a.752.752 0 01.166-.252l3.96-3.96.195-.176a2.659 2.659 0 013.566.177l.177.195a2.66 2.66 0 01.601 1.685l-.013.263z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GasPaymaster;
