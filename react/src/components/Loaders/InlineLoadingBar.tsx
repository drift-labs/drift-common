import { useEffect, useState } from 'react';

export const InlineLoadingBar = () => {
	const [width, setWidth] = useState(0);

	/**
	 * This is a simple animation that will animate the width of the loading bar.
	 * It will animate from 0 to 100% in 1 second.
	 * We avoid using CSS animations because they are not supported in React Native.
	 */
	useEffect(() => {
		let animationFrame: number;
		let startTime: number;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = (timestamp - startTime) % 1000; // 1000ms = 1 second
			const newWidth = (progress / 1000) * 100; // Convert to percentage
			setWidth(newWidth);
			animationFrame = requestAnimationFrame(animate);
		};

		animationFrame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrame);
	}, []);

	return (
		<div className="block w-[40px] h-[10px] rounded-[5px] border-darkBlue-80 border-solid p-[1px] bg-transparent">
			<div
				className="bg-static-emphasized h-full rounded-[5px]"
				style={{
					width: `${width}%`,
					transition: 'width 16ms linear',
				}}
			/>
		</div>
	);
};
