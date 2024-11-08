'use client';

import { useEffect, useRef } from 'react';

export const ActiveDot = ({
	x,
	y,
	stroke,
	size = 32,
	strokeWidth = 8,
	fill,
	className,
}: {
	x: number;
	y: number;
	stroke: string;
	size?: number;
	strokeWidth?: number;
	fill?: string;
	className?: string;
}) => {
	const radius = size / 2;
	const circleRef = useRef<SVGCircleElement>(null);

	useEffect(() => {
		if (circleRef.current) {
			circleRef.current.style.transform = 'scale(1)';
		}
	}, []);

	return (
		<svg
			x={x - radius}
			y={y - radius}
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle
				ref={circleRef}
				className="animate-active-dot"
				cx={radius}
				cy={radius}
				r={radius - strokeWidth / 2}
				stroke={stroke}
				strokeWidth={strokeWidth}
				fill={fill}
			/>
		</svg>
	);
};
