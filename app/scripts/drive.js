/**
 * Class that wraps CORS functions for accessing google drive
 * Does not use GAPI. See:
 * https://developers.google.com/api-client-library/javascript/features/cors
 * https://developers.google.com/drive/v2/reference/
 */
function Drive() {
	this.authToken = null;
}

Drive.prototype = {

	/**
	 * Get google auth token
	 * @param  {bool}     interactive displays google signin page
	 * @param  {Function} callback on success or failure
	 *   - this.authToken will be non-null on success
	 *   - chrome.runtime.lastError will be set on failure
	 */
	auth: function(interactive, callback) {
		chrome.identity.getAuthToken({interactive: interactive}, function(token) {
			this.authToken = token || null;
			this.handleError(chrome.runtime.lastError);
			callback();
		}.bind(this));
	},

	/**
	 * Signout of google account and delete cached auth token
	 * @param  {Function} callback on success or failure
	 */
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

	/**
	 * Get list of files from google drive using query string (?q=)
	 * @param  {String}   query string for google drive file search
	 * @param  {Function} callback on success or failure
	 *  callback params:
	 *    - status contains http status code (success = 200)
	 *    - responseText contains json array of files metata on success
	 *       json error message on failure
	 */
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

	/**
	 * Download file from google Drive
	 * @param  {String}   fileid of file to download
	 * @param  {Function} callback on success or failure
	 *   - status contains http status code (success = 200)
	 *   - responseText contains file data on success (not json)
	 *       json error message on failure
	 */
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

	/**
	 * Upload file to google drive
	 * @param  {String}   fileid of file to update or null if new file
	 * @param  {Blob}     content containing data, mimetype, and name
	 * @param  {Function} callback on success
	 */
	upload: function(fileid, content, callback) {
		const boundary = '-------314159265358979323846';
		var method = '';
		var url = 'https://www.googleapis.com/upload/drive/v2/files';

		if (fileid) {
			method = 'PUT';
			url += '/' + fileid;
		} else {
			method = 'POST';
		}
		url += '?uploadType=multipart';

		var metadata = {
			'mimeType': content.type,
			'title': content.name
		};

		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.setRequestHeader('Authorization', 'Bearer ' + this.authToken);
		xhr.setRequestHeader('Content-Type', 'multipart/related; boundary="' + boundary + '"');
		xhr.onload = function() {
			callback(xhr.status, xhr.responseText);
		};
		xhr.onerror = this.handleError;

		var reader = new FileReader();
		reader.onload = function() {
			var multipartRequestBody =
				'\r\n--' + boundary + '\r\n' +
				'Content-Type: application/json\r\n\r\n' +
				JSON.stringify(metadata) +
				'\r\n--' + boundary + '\r\n' +
				'Content-Type: ' + content.type + '\r\n\r\n' +
				reader.result +
				'\r\n--' + boundary + '--';
			xhr.send(multipartRequestBody);

		}
		reader.readAsText(content);
	},

	/**
	 * Move file to trash on google drive
	 * @param  {String}   fileid  of file to trash
	 * @param  {Function} callback on success or failure
	 */
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

	/**
	 * Log errors
	 * @param  {String} error message
	 */
	handleError: function(error) {
		if (error) {
			console.log(error);
		}
	},
}

