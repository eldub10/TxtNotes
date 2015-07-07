
window.addEventListener('message', function() {
	console.log(event.data);
	event.source.postMessage('message from sandbox.js', event.origin);
});
