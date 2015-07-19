

function Drive() {
	this.authToken = null;
}

Drive.prototype = {

	auth: function(interactive, callback) {
		chrome.identity.getAuthToken({interactive: interactive}, function(token) {
			this.authToken = token || null;
			this.handleError(chrome.runtime.lastError);
			callback();
		}.bind(this));
	},

	revoke: function(callback) {
		if (this.authToken) {
			var token = this.authToken;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
				token);
			xhr.send();
			this.authToken = null;
			chrome.identity.removeCachedAuthToken({token: token}, function() {
				callback();
			});
		} else {
			callback();
		}
	},

	list: function(query, callback) {
		var xhr = new XMLHttpRequest();
		var q = encodeURIComponent(query);
		var url = 'https://www.googleapis.com/drive/v2/files?q=' + q;
		xhr.open('GET', url);
		xhr.setRequestHeader('Authorization', 'Bearer ' + this.authToken);
		xhr.onload = function() {
			callback(xhr.status, xhr.responseText);
		};
		xhr.onerror = this.handleError;
		xhr.send();
	},

	download: function(fileid, callback) {
		var xhr = new XMLHttpRequest();
		var url = 'https://www.googleapis.com/drive/v2/files/' + fileid + '?alt=media';
		xhr.open('GET', url);
		xhr.setRequestHeader('Authorization', 'Bearer ' + this.authToken);
		xhr.onload = function() {
			callback(xhr.status, xhr.responseText);
		};
		xhr.onerror = this.handleError;
		xhr.send();
	},

	upload: function(fileid, content, callback) {
		var uploader = new MediaUploader({
			file: content,
			token: this.authToken,
			fileId: fileid,
			params: {newRevision: false},
			onComplete: callback,
			onError: this.handleError
		});
		uploader.upload();
	},

	trash: function(fileid, callback) {
		var xhr = new XMLHttpRequest();
		var url = 'https://www.googleapis.com/drive/v2/files/' + fileid + '/trash';
		xhr.open('POST', url);
		xhr.setRequestHeader('Authorization', 'Bearer ' + this.authToken);
		xhr.onload = function(e) {
			callback(xhr.status, xhr.responseText);
		};
		xhr.onerror = this.handleError;
		xhr.send();
	},

	handleError: function(error) {
		if (error) {
			console.log(error);
		}
	},
}

