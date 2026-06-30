import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Hotified = (allProps: IconProps) => {
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
						d="M9.782 2.178c-.005-.129.126-.212.227-.148l.821.516c1.124.708 2.024 1.725 2.672 3.027.783 1.569 1.14 3.01 1.067 4.286-.002.04.013.08.042.108a.114.114 0 00.092.034.132.132 0 00.041-.01l.046-.035c.42-.5.718-1.008.879-1.506l.258-.793a.166.166 0 01.042-.065.15.15 0 01.138-.038c.025.006.047.019.066.037l.578.566a7.38 7.38 0 011.647 2.445c.396.948.594 1.954.594 2.989a7.732 7.732 0 01-.55 2.885 7.386 7.386 0 01-1.5 2.352 6.914 6.914 0 01-2.222 1.585 6.64 6.64 0 01-2.72.58 6.608 6.608 0 01-2.72-.582 6.97 6.97 0 01-2.222-1.585 7.456 7.456 0 01-1.5-2.352h0a7.731 7.731 0 01-.55-2.885l.012-.426a7.775 7.775 0 01.707-2.848A7.399 7.399 0 017.72 7.737a6.18 6.18 0 001.882-2.713c.179-.513.254-1.13.224-1.827l-.044-1.02z"
						fill={allProps.color ? allProps.color : 'currentColor'}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={0.016}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Hotified;
