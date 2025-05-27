import * as React from 'react';
import { IconProps } from '../../types';
import { IconWrapper } from '../IconWrapper';

const Migration = (allProps: IconProps) => {
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
						d="M15.234 3.473a.75.75 0 01-.007 1.06l-1.4 1.384H16.5c.673 0 1.32.264 1.8.737.479.473.75 1.117.75 1.79v5.554c1.54.338 2.7 1.697 2.7 3.335 0 1.896-1.553 3.417-3.45 3.417-1.897 0-3.45-1.52-3.45-3.417 0-1.638 1.16-2.997 2.7-3.335V8.444c0-.27-.108-.53-.304-.723a1.062 1.062 0 00-.746-.304h-2.673l1.4 1.383a.75.75 0 11-1.054 1.067l-2.7-2.667a.75.75 0 010-1.067l2.7-2.667a.75.75 0 011.06.007zM5.7 4.75c-1.086 0-1.95.867-1.95 1.917s.864 1.916 1.95 1.916c1.086 0 1.95-.867 1.95-1.916 0-1.05-.864-1.917-1.95-1.917zM2.25 6.667C2.25 4.77 3.803 3.25 5.7 3.25c1.897 0 3.45 1.52 3.45 3.417 0 1.638-1.16 2.997-2.7 3.335V20a.75.75 0 01-1.5 0v-9.998c-1.54-.338-2.7-1.697-2.7-3.335zm16.05 8.75c-1.086 0-1.95.867-1.95 1.916 0 1.05.864 1.917 1.95 1.917 1.086 0 1.95-.867 1.95-1.917s-.864-1.916-1.95-1.916z"
						fill={allProps.color ? allProps.color : 'currentColor'}
					/>
				</svg>
			}
			{...restProps}
		/>
	);
};
export default Migration;
