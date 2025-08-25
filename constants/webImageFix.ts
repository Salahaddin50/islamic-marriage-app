/**
 * Helper module to fix image paths for web platform
 */

/**
 * Converts a relative image path to a proper web URL
 * This helps resolve the <link rel=preload> invalid href errors
 * 
 * @param relativePath The relative path to the image (e.g., 'users/user1.jpeg')
 * @returns A properly formatted URL for web use
 */
export function getWebImagePath(relativePath: string): string {
  // For web, we need to use a proper URL format that works with the Expo Router web build
  // Since the images are not being found at /assets/images/, let's use a more reliable approach
  
  // Use a data URI for the default user profile picture to avoid 404 errors
  if (relativePath.includes('user1.jpeg')) {
    // Return a simple data URI for a placeholder avatar
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFgUlEQVR4nO2dW4hVVRjHf2fGcZwZL5QxlVYUEWEPYmZmZEQU1EMJPfRglBYVlBZFUfRQD0FRQpBRDz1UL1FBSRFRUQhFZRdCzG6WlmZpWpmXGS+j08Pax5nOzNn77L3X2mvvPesHHzjMWd/6r/Wftc/a67vWAYPBYDAYDAaDwWAwGAwGg8FgMBgMBoOhFWqDNqAG5gKLgYuAOcB0YBIwARgPtAFHgR5gP7AL+BXYDnwP7K+7xTXQBtwFvA/0AqrKowf4EFgJtNfR+Ly4EngLOE71QrRy9AEbgKvqFUQWTAJeAQYIL0RrxwCwDphcl2gipA14jHCVU7VjA3BG+JCi4wHgEPUVo/k4BDwYPKrIuAXoJ1tBKKAfeChwbNFwLrCTbAVpPnYC8wPGFwVtwOfUV4zK8QUwLliEEfAi9RejcrwULMLAnE/2vag0xwBwYaggQ3Il2Y+g0h5dwOUhAg3JRtILsgm4G7gBuBZYDrwO/JXyuY2BYg3GVNILshpoa7HtNOA14ETK51+vOdagPEE6MXqAC1Jsfy7wR4ptlmuMNSjnkO5o6jdgSoZ9zCFdZXZrizeYIJ+RXJBBYFnG/TxJusp5UlPMQZlJukq5PcO+pgF/ptjPIeCsDPuKgjdJLsjWjPtaTLrK2ZJxX1GwmOSCDAEXZ9jXBNJ1EJRjYYZ9RUEb8AfJBdmQYX/3ka5y7s2wr2h4hOSCDAIzU+5rPOkqpwe9vbXMmQR0klyUZ1Lub2XK/SnHIzoDzpqHSS7IUdL1tiaRvnJ6gYn6ws2e8SSvrhRwf4r9PU+6yrlPZ7B5sYLkghwAJibsawZwOOX+ZugLNx/agf0kF+aVhH09T7rKeU5jrLnyGMkF6QcmxexnJnAk5X4OA2fqDDZP2oE/SS7OmzH7WUW6ynlDZ6B58wjJBRkApsZsfw7pK+cQcLbGOHOnA9hHcoHeitn+VdJVzmoNMUbDwyQXRNH4JbXYdh7pK6cLmKUxzmhoB/aQXKQPWmx7A+kq5y1dQcbGMtIJMgRc1mK7+aSvnIPAeRrjjIp2YDfJhfqsxXZrSFc5b+sKMkaWkk6QQeDSpm3OJ33ldKKvc5kL7cAu0lXKuqZtXiNd5azTE2KcLCGdIEPAJcAC0ldOJ3C+phjjRIqyg3SVsrFpmy9JVznv6AkxXpaQTpAh4GJgIekrpxOYrSnGaJGi7CBdpWxu2uZr0lXOek0xxs0S0gkyBFxE+srpAs7RFGP0SFF+I12lfNe0zXekq5wNmmKMniWkE2QImE/6yukCztUUYxZIUX4lXaU0P/X4PekqZ6OmGDPhVmAVsAWZxdmIFGgV8k6jFYtJJ8gQMI/0ldMNTNcUYyZMRN7RqQzHPuCOmG3fJV3lbNIUY3DuoLVTqhyDwNyYbTeSvnI2a4oxKO3AVzQKspPWb+UWka5yuoEZmmIMxu20dkgBvwCTY7bdRLrK+VhTjMGQovQgg0ytwt9K6zeAi0hXOT3ATE0xBmEZrZ1RwG/AlJhtPyFd5XyiKcYgSFEOIINMrcLfhgxUtWIx6SqnB7hAU4zaWU5rRxTwOzLvKo5PSVc5n2qKUTtSlEPIIFOr8LfT+g3gEtJVTi9woaYYtbKC1k4oYA8yXhXHZ6SrnM80xagVKcphZJCpVfg7aP0GcCnpKqcXuEhTjNpYSWsHFLAXmBqz7eekq5zPNcWoDSnKEWSQqVX4O2n9BnAZ6SqnD5ijKUYtrKK18QrYB0yL2fYL0lXOF5pi1IIU5SgyyNQq/F3Ek7Zy+oC5mmLUwmpaG66A/cD0mG23kK5yvtQUo3LOovUDLQXsJ/5ZxjbSVU4/cLGmGLVwJvLwKanxB4AZMZ/9inSV85WmGLVxBvJMI6nxB4kXZDvpKucbTTEaDAbD/5p/AYCPeuoZrIybAAAAAElFTkSuQmCC';
  }
  
  // For other images, try to use the correct path
  return `/_expo/static/images/${relativePath}`;
}

/**
 * Fixes an image source object for web use
 * 
 * @param imageSource The image source object (e.g., from require() or { uri: '...' })
 * @returns A properly formatted image source for web use
 */
export function fixWebImageSource(imageSource: any): any {
  if (!imageSource) return null;
  
  // If it's already a proper URL, return it as is
  if (typeof imageSource === 'object' && imageSource.uri && 
      (imageSource.uri.startsWith('http://') || imageSource.uri.startsWith('https://'))) {
    return imageSource;
  }
  
  // If it's a require() reference (number), we need to handle it specially for web
  if (typeof imageSource === 'number') {
    // For web, we can't easily resolve require() numbers
    // Return a data URI for the default avatar
    return { 
      uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFgUlEQVR4nO2dW4hVVRjHf2fGcZwZL5QxlVYUEWEPYmZmZEQU1EMJPfRglBYVlBZFUfRQD0FRQpBRDz1UL1FBSRFRUQhFZRdCzG6WlmZpWpmXGS+j08Pax5nOzNn77L3X2mvvPesHHzjMWd/6r/Wftc/a67vWAYPBYDAYDAaDwWAwGAwGg8FgMBgMBoOhFWqDNqAG5gKLgYuAOcB0YBIwARgPtAFHgR5gP7AL+BXYDnwP7K+7xTXQBtwFvA/0AqrKowf4EFgJtNfR+Ly4EngLOE71QrRy9AEbgKvqFUQWTAJeAQYIL0RrxwCwDphcl2gipA14jHCVU7VjA3BG+JCi4wHgEPUVo/k4BDwYPKrIuAXoJ1tBKKAfeChwbNFwLrCTbAVpPnYC8wPGFwVtwOfUV4zK8QUwLliEEfAi9RejcrwULMLAnE/2vag0xwBwYaggQ3Il2Y+g0h5dwOUhAg3JRtILsgm4G7gBuBZYDrwO/JXyuY2BYg3GVNILshpoa7HtNOA14ETK51+vOdagPEE6MXqAC1Jsfy7wR4ptlmuMNSjnkO5o6jdgSoZ9zCFdZXZrizeYIJ+RXJBBYFnG/TxJusp5UlPMQZlJukq5PcO+pgF/ptjPIeCsDPuKgjdJLsjWjPtaTLrK2ZJxX1GwmOSCDAEXZ9jXBNJ1EJRjYYZ9RUEb8AfJBdmQYX/3ka5y7s2wr2h4hOSCDAIzU+5rPOkqpwe9vbXMmQR0klyUZ1Lub2XK/SnHIzoDzpqHSS7IUdL1tiaRvnJ6gYn6ws2e8SSvrhRwf4r9PU+6yrlPZ7B5sYLkghwAJibsawZwOOX+ZugLNx/agf0kF+aVhH09T7rKeU5jrLnyGMkF6QcmxexnJnAk5X4OA2fqDDZP2oE/SS7OmzH7WUW6ynlDZ6B58wjJBRkApsZsfw7pK+cQcLbGOHOnA9hHcoHeitn+VdJVzmoNMUbDwyQXRNH4JbXYdh7pK6cLmKUxzmhoB/aQXKQPWmx7A+kq5y1dQcbGMtIJMgRc1mK7+aSvnIPAeRrjjIp2YDfJhfqsxXZrSFc5b+sKMkaWkk6QQeDSpm3OJ33ldKKvc5kL7cAu0lXKuqZtXiNd5azTE2KcLCGdIEPAJcAC0ldOJ3C+phjjRIqyg3SVsrFpmy9JVznv6AkxXpaQTpAh4GJgIekrpxOYrSnGaJGi7CBdpWxu2uZr0lXOek0xxs0S0gkyBFxE+srpAs7RFGP0SFF+I12lfNe0zXekq5wNmmKMniWkE2QImE/6yukCztUUYxZIUX4lXaU0P/X4PekqZ6OmGDPhVmAVsAWZxdmIFGgV8k6jFYtJJ8gQMI/0ldMNTNcUYyZMRN7RqQzHPuCOmG3fJV3lbNIUY3DuoLVTqhyDwNyYbTeSvnI2a4oxKO3AVzQKspPWb+UWka5yuoEZmmIMxu20dkgBvwCTY7bdRLrK+VhTjMGQovQgg0ytwt9K6zeAi0hXOT3ATE0xBmEZrZ1RwG/AlJhtPyFd5XyiKcYgSFEOIINMrcLfhgxUtWIx6SqnB7hAU4zaWU5rRxTwOzLvKo5PSVc5n2qKUTtSlEPIIFOr8LfT+g3gEtJVTi9woaYYtbKC1k4oYA8yXhXHZ6SrnM80xagVKcphZJCpVfg7aP0GcCnpKqcXuEhTjNpYSWsHFLAXmBqz7eekq5zPNcWoDSnKEWSQqVX4O2n9BnAZ6SqnD5ijKUYtrKK18QrYB0yL2fYL0lXOF5pi1IIU5SgyyNQq/F3Ek7Zy+oC5mmLUwmpaG66A/cD0mG23kK5yvtQUo3LOovUDLQXsJ/5ZxjbSVU4/cLGmGLVwJvJMI6nxB4AZMZ/9inSV85WmGLVxBvJMI6nxB4kXZDvpKucbTTEaDAbD/5p/AYCPeuoZrIybAAAAAElFTkSuQmCC' 
    };
  }
  
  // If it's an object with a uri that uses the unstable_path format, fix it
  if (typeof imageSource === 'object' && imageSource.uri && 
      imageSource.uri.includes('unstable_path')) {
    // Extract the actual path from the unstable_path parameter
    const match = imageSource.uri.match(/unstable_path=(.+?)(&|$)/);
    if (match && match[1]) {
      const decodedPath = decodeURIComponent(match[1]);
      // Remove the leading ./ if present
      const cleanPath = decodedPath.replace(/^\.\//g, '');
      
      // If it's the default user avatar, use the data URI
      if (cleanPath.includes('user1.jpeg')) {
        return { 
          uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFgUlEQVR4nO2dW4hVVRjHf2fGcZwZL5QxlVYUEWEPYmZmZEQU1EMJPfRglBYVlBZFUfRQD0FRQpBRDz1UL1FBSRFRUQhFZRdCzG6WlmZpWpmXGS+j08Pax5nOzNn77L3X2mvvPesHHzjMWd/6r/Wftc/a67vWAYPBYDAYDAaDwWAwGAwGg8FgMBgMBoOhFWqDNqAG5gKLgYuAOcB0YBIwARgPtAFHgR5gP7AL+BXYDnwP7K+7xTXQBtwFvA/0AqrKowf4EFgJtNfR+Ly4EngLOE71QrRy9AEbgKvqFUQWTAJeAQYIL0RrxwCwDphcl2gipA14jHCVU7VjA3BG+JCi4wHgEPUVo/k4BDwYPKrIuAXoJ1tBKKAfeChwbNFwLrCTbAVpPnYC8wPGFwVtwOfUV4zK8QUwLliEEfAi9RejcrwULMLAnE/2vag0xwBwYaggQ3Il2Y+g0h5dwOUhAg3JRtILsgm4G7gBuBZYDrwO/JXyuY2BYg3GVNILshpoa7HtNOA14ETK51+vOdagPEE6MXqAC1Jsfy7wR4ptlmuMNSjnkO5o6jdgSoZ9zCFdZXZrizeYIJ+RXJBBYFnG/TxJusp5UlPMQZlJukq5PcO+pgF/ptjPIeCsDPuKgjdJLsjWjPtaTLrK2ZJxX1GwmOSCDAEXZ9jXBNJ1EJRjYYZ9RUEb8AfJBdmQYX/3ka5y7s2wr2h4hOSCDAIzU+5rPOkqpwe9vbXMmQR0klyUZ1Lub2XK/SnHIzoDzpqHSS7IUdL1tiaRvnJ6gYn6ws2e8SSvrhRwf4r9PU+6yrlPZ7B5sYLkghwAJibsawZwOOX+ZugLNx/agf0kF+aVhH09T7rKeU5jrLnyGMkF6QcmxexnJnAk5X4OA2fqDDZP2oE/SS7OmzH7WUW6ynlDZ6B58wjJBRkApsZsfw7pK+cQcLbGOHOnA9hHcoHeitn+VdJVzmoNMUbDwyQXRNH4JbXYdh7pK6cLmKUxzmhoB/aQXKQPWmx7A+kq5y1dQcbGMtIJMgRc1mK7+aSvnIPAeRrjjIp2YDfJhfqsxXZrSFc5b+sKMkaWkk6QQeDSpm3OJ33ldKKvc5kL7cAu0lXKuqZtXiNd5azTE2KcLCGdIEPAJcAC0ldOJ3C+phjjRIqyg3SVsrFpmy9JVznv6AkxXpaQTpAh4GJgIekrpxOYrSnGaJGi7CBdpWxu2uZr0lXOek0xxs0S0gkyBFxE+srpAs7RFGP0SFF+I12lfNe0zXekq5wNmmKMniWkE2QImE/6yukCztUUYxZIUX4lXaU0P/X4PekqZ6OmGDPhVmAVsAWZxdmIFGgV8k6jFYtJJ8gQMI/0ldMNTNcUYyZMRN7RqQzHPuCOmG3fJV3lbNIUY3DuoLVTqhyDwNyYbTeSvnI2a4oxKO3AVzQKspPWb+UWka5yuoEZmmIMxu20dkgBvwCTY7bdRLrK+VhTjMGQovQgg0ytwt9K6zeAi0hXOT3ATE0xBmEZrZ1RwG/AlJhtPyFd5XyiKcYgSFEOIINMrcLfhgxUtWIx6SqnB7hAU4zaWU5rRxTwOzLvKo5PSVc5n2qKUTtSlEPIIFOr8LfT+g3gEtJVTi9woaYYtbKC1k4oYA8yXhXHZ6SrnM80xagVKcphZJCpVfg7aP0GcCnpKqcXuEhTjNpYSWsHFLAXmBqz7eekq5zPNcWoDSnKEWSQqVX4O2n9BnAZ6SqnD5ijKUYtrKK18QrYB0yL2fYL0lXOF5pi1IIU5SgyyNQq/F3Ek7Zy+oC5mmLUwmpaG66A/cD0mG23kK5yvtQUo3LOovUDLQXsJ/5ZxjbSVU4/cLGmGLVwJvJMI6nxB4AZMZ/9inSV85WmGLVxBvJMI6nxB4kXZDvpKucbTTEaDAbD/5p/AYCPeuoZrIybAAAAAElFTkSuQmCC' 
        };
      }
      
      return { uri: `/_expo/static/images/${cleanPath}` };
    }
  }
  
  // If it's an object with a uri that points to a default user image
  if (typeof imageSource === 'object' && imageSource.uri && 
      (imageSource.uri.includes('user1.jpeg') || imageSource.uri.includes('/assets/'))) {
    return { 
      uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFgUlEQVR4nO2dW4hVVRjHf2fGcZwZL5QxlVYUEWEPYmZmZEQU1EMJPfRglBYVlBZFUfRQD0FRQpBRDz1UL1FBSRFRUQhFZRdCzG6WlmZpWpmXGS+j08Pax5nOzNn77L3X2mvvPesHHzjMWd/6r/Wftc/a67vWAYPBYDAYDAaDwWAwGAwGg8FgMBgMBoOhFWqDNqAG5gKLgYuAOcB0YBIwARgPtAFHgR5gP7AL+BXYDnwP7K+7xTXQBtwFvA/0AqrKowf4EFgJtNfR+Ly4EngLOE71QrRy9AEbgKvqFUQWTAJeAQYIL0RrxwCwDphcl2gipA14jHCVU7VjA3BG+JCi4wHgEPUVo/k4BDwYPKrIuAXoJ1tBKKAfeChwbNFwLrCTbAVpPnYC8wPGFwVtwOfUV4zK8QUwLliEEfAi9RejcrwULMLAnE/2vag0xwBwYaggQ3Il2Y+g0h5dwOUhAg3JRtILsgm4G7gBuBZYDrwO/JXyuY2BYg3GVNILshpoa7HtNOA14ETK51+vOdagPEE6MXqAC1Jsfy7wR4ptlmuMNSjnkO5o6jdgSoZ9zCFdZXZrizeYIJ+RXJBBYFnG/TxJusp5UlPMQZlJukq5PcO+pgF/ptjPIeCsDPuKgjdJLsjWjPtaTLrK2ZJxX1GwmOSCDAEXZ9jXBNJ1EJRjYYZ9RUEb8AfJBdmQYX/3ka5y7s2wr2h4hOSCDAIzU+5rPOkqpwe9vbXMmQR0klyUZ1Lub2XK/SnHIzoDzpqHSS7IUdL1tiaRvnJ6gYn6ws2e8SSvrhRwf4r9PU+6yrlPZ7B5sYLkghwAJibsawZwOOX+ZugLNx/agf0kF+aVhH09T7rKeU5jrLnyGMkF6QcmxexnJnAk5X4OA2fqDDZP2oE/SS7OmzH7WUW6ynlDZ6B58wjJBRkApsZsfw7pK+cQcLbGOHOnA9hHcoHeitn+VdJVzmoNMUbDwyQXRNH4JbXYdh7pK6cLmKUxzmhoB/aQXKQPWmx7A+kq5y1dQcbGMtIJMgRc1mK7+aSvnIPAeRrjjIp2YDfJhfqsxXZrSFc5b+sKMkaWkk6QQeDSpm3OJ33ldKKvc5kL7cAu0lXKuqZtXiNd5azTE2KcLCGdIEPAJcAC0ldOJ3C+phjjRIqyg3SVsrFpmy9JVznv6AkxXpaQTpAh4GJgIekrpxOYrSnGaJGi7CBdpWxu2uZr0lXOek0xxs0S0gkyBFxE+srpAs7RFGP0SFF+I12lfNe0zXekq5wNmmKMniWkE2QImE/6yukCztUUYxZIUX4lXaU0P/X4PekqZ6OmGDPhVmAVsAWZxdmIFGgV8k6jFYtJJ8gQMI/0ldMNTNcUYyZMRN7RqQzHPuCOmG3fJV3lbNIUY3DuoLVTqhyDwNyYbTeSvnI2a4oxKO3AVzQKspPWb+UWka5yuoEZmmIMxu20dkgBvwCTY7bdRLrK+VhTjMGQovQgg0ytwt9K6zeAi0hXOT3ATE0xBmEZrZ1RwG/AlJhtPyFd5XyiKcYgSFEOIINMrcLfhgxUtWIx6SqnB7hAU4zaWU5rRxTwOzLvKo5PSVc5n2qKUTtSlEPIIFOr8LfT+g3gEtJVTi9woaYYtbKC1k4oYA8yXhXHZ6SrnM80xagVKcphZJCpVfg7aP0GcCnpKqcXuEhTjNpYSWsHFLAXmBqz7eekq5zPNcWoDSnKEWSQqVX4O2n9BnAZ6SqnD5ijKUYtrKK18QrYB0yL2fYL0lXOF5pi1IIU5SgyyNQq/F3Ek7Zy+oC5mmLUwmpaG66A/cD0mG23kK5yvtQUo3LOovUDLQXsJ/5ZxjbSVU4/cLGmGLVwJvJMI6nxB4AZMZ/9inSV85WmGLVxBvJMI6nxB4kXZDvpKucbTTEaDAbD/5p/AYCPeuoZrIybAAAAAElFTkSuQmCC' 
    };
  }
  
  // Return the original source if we couldn't fix it
  return imageSource;
}
