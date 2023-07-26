import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const IFStaking = (allProps: IconProps) => {
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
					<rect
						x={1.867}
						y={3.2}
						width={12.267}
						height={9.6}
						rx={0.8}
						stroke={allProps.color ? allProps.color : 'currentColor'}
						strokeWidth={1.067}
					/>
					<path
						d="M6.064 5.27a.533.533 0 10-.754.754l.754-.755zm3.912 5.42a.533.533 0 10.755-.754l-.755.754zM5.31 9.936a.533.533 0 10.754.754l-.754-.754zm5.42-3.912a.533.533 0 10-.754-.755l.755.755zM9.134 8c0 .468-.118.726-.263.87-.144.145-.402.263-.87.263V10.2c.637 0 1.212-.163 1.625-.575.412-.413.575-.988.575-1.625H9.133zM8 9.133c-.468 0-.726-.118-.87-.263-.145-.144-.263-.402-.263-.87H5.8c0 .637.163 1.212.575 1.625.413.412.988.575 1.625.575V9.133zM6.867 8c0-.468.118-.726.263-.87.144-.145.402-.263.87-.263V5.8c-.637 0-1.212.163-1.625.575C5.963 6.788 5.8 7.363 5.8 8h1.067zM8 6.867c.468 0 .726.118.87.263.145.144.263.402.263.87H10.2c0-.637-.163-1.212-.575-1.625C9.212 5.963 8.637 5.8 8 5.8v1.067zm-2.69-.843L6.476 7.19l.755-.754-1.167-1.167-.754.755zM9.564 7.19l1.167-1.166-.755-.755L8.81 6.436l.754.754zM8.81 9.524l1.166 1.166.755-.754-1.167-1.167-.754.755zM6.064 10.69l1.167-1.166-.755-.755L5.31 9.936l.754.754z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default IFStaking;
