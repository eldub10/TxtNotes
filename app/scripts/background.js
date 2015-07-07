/**
 * Listens for the app launching, then creates the window.
 */
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('main.html', {
		id: 'main',
		bounds: {width: 360, height: 640}
	});
});
