import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the browser window's current width.
 */
export const useWindowWidth = () => {
  // Initialize state to 0 or undefined.
  // We'll set the real width in useEffect to ensure it runs on the client.
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Handler function to update state with the current window width
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Set the initial width once the component mounts (client-side)
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup function to remove the event listener
    // This prevents memory leaks when the component unmounts
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this effect runs only on mount and unmount

  return width;
};