import { useEffect } from 'react';

/**
 * Disables overflow on the document body while an element is being rendered
 */
const useDisableScroll = () => {
	useEffect(() => {
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = 'auto';
		};
	});
};

export default useDisableScroll;
