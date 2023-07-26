import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const GraphCircle = (allProps: IconProps) => {
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
						d="M11.717 6.987a.5.5 0 00-.768-.64L9.751 7.784c-.246.297-.399.477-.524.59a.51.51 0 01-.108.081l-.008.004-.007-.004a.511.511 0 01-.11-.081c-.124-.113-.276-.293-.523-.59l-.195-.233c-.22-.264-.417-.5-.6-.667-.201-.181-.454-.343-.787-.343-.334 0-.586.162-.787.343-.184.167-.381.403-.6.667l-1.22 1.462a.5.5 0 00.769.64l1.198-1.437c.246-.297.399-.477.524-.59a.51.51 0 01.108-.081l.008-.004.007.004c.04.022.077.05.11.081.124.113.276.293.523.59l.195.233c.22.264.417.5.6.667.201.181.454.343.787.343.334 0 .586-.162.787-.343.184-.167.381-.403.6-.667l1.22-1.462z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
					<rect
						x={2.5}
						y={2.5}
						width={11}
						height={11}
						rx={5.5}
						stroke={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default GraphCircle;
