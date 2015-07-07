/**
 * Listens for the app launching, then creates the window.
 */
var main;
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('main.html', {
		id: 'main',
		bounds: {width: 360, height: 640}
	}, function(createdWindow) {
		main = createdWindow;
	});
});

chrome.runtime.onInstalled.addListener(function() {

});

chrome.runtime.onSuspend.addListener(function() {
	//TODO
});
