import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Delegation = (allProps: IconProps) => {
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
						d="M8.5 12.668V12.4a.9.9 0 01.136-.482.672.672 0 01.346-.285h0l.011-.005c.369-.153.75-.269 1.146-.346a6.19 6.19 0 011.195-.115h0c.401 0 .8.038 1.196.116.396.077.777.192 1.145.345h0l.01.004a.675.675 0 01.348.287c.09.15.135.306.134.48v.268c0 .062-.015.092-.045.121-.03.03-.059.046-.12.045H8.667c-.062 0-.092-.015-.121-.045-.03-.03-.045-.059-.045-.12zm-6.666 0v-1.335c0-.166.056-.354.209-.57.145-.206.373-.406.712-.59a8.873 8.873 0 011.861-.733 7.713 7.713 0 012.051-.273h0c.276 0 .574.02.894.062.198.026.4.06.606.103v.13c-.042.018-.084.038-.123.057-.117.059-.24.123-.366.192h0l-.007.004a2.89 2.89 0 00-1.123 1.108c-.226.403-.38.804-.38 1.177v.833H2c-.063 0-.092-.015-.122-.045l-.354.353.354-.353c-.03-.03-.045-.059-.045-.12zm9.5-3.168a1.11 1.11 0 01-.83-.337 1.11 1.11 0 01-.337-.83c0-.337.111-.603.337-.83a1.11 1.11 0 01.83-.336c.338 0 .604.11.83.337.226.226.337.492.337.83 0 .337-.111.603-.337.83a1.11 1.11 0 01-.83.336zm-4.667-2c-.6 0-1.1-.208-1.53-.637-.429-.43-.636-.93-.636-1.53s.207-1.1.637-1.53c.429-.429.93-.636 1.53-.636.599 0 1.1.207 1.53.637.428.429.636.93.636 1.53 0 .599-.208 1.1-.637 1.53-.43.428-.93.636-1.53.636z"
						stroke={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Delegation;
