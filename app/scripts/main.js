
/**********************************************************
 * main
 */
jQuery(function($) {
'use strict';

var app = {
	file: null
}
var drive = new Drive();

function init() {
	drive.auth(false, function() {
		console.log(drive.authToken);
		loadPage(Boolean(drive.authToken) ? '#main' : '#signin');
	})
}

function signIn() {
	drive.auth(true, function() {
		if (drive.authToken) {
			console.log(drive.authToken);
			loadPage('#main');
		} else {
			$('#labelSignin').text('Unable to connect. ' + chrome.runtime.lastError.message);
			$('#popupSignin').popup('open');
		}
	});
}

function signOut() {
	drive.revoke(function() {
		console.log(drive.authToken);
		loadPage('#signin');
	});
}

function localOnly() {
	loadPage('#main');
}

function loadConfig(callback) {
	chrome.storage.local.get(null, function(value) {
		app.file = value;
		callback();
	});
}

function saveConfig() {
	chrome.storage.local.set(app.file);
}

function loadPage(page) {
	$(':mobile-pagecontainer').pagecontainer('change', page);
	switch (page) {
		case '#main':
			loadConfig(function() {
				loadFile();
			});
			break;
		case '#signin':
			//TODO: unloadFile
			break;
		case '#splash':
			break;
	}

}

function loadFile() {
	if (app.file.id) {
		$('#itemList').html("Loading file...");
		fileDownload(app.file.id, function(data) {
			if (data) {
				app.file.data = data;
				renderData(app.file.name, app.file.data);
				saveConfig();
			}
		});
	} else if (app.file.data) {
		renderData(app.file.name, app.file.data);
	}
}

function renderData(filename, data) {
	var items = '';
	var counter = 0;
	data = data.replace(/\r\n/g, '\n')
	var lines = data.split('\n');

	// set filename in titlebar
	$('#fileLabel').text(filename);

	// loop through each line of file and create html elements:
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].length > 0) {
			if (counter === 0) {
				items += '<div class="items" data-role="collapsible" spellcheck="false"><h4><div>' + lines[i] + '</div></h4>';
			} else {
				items += '<p>' + lines[i] + '</p>';
			}
			counter++;
		} else {
			if (counter === 1) {
				items += '<p><br></p>'
			}
			if (counter > 0) {
				items += '</div>';
			}
			counter = 0;
		}
	}
	$('#itemList').html(items).enhanceWithin();

	// call linkify.js plugin to make anchor tags for urls
	$('.items p').linkify();
}

function serializeData() {
	// get data from html and format as string with line breaks
	$('.ui-collapsible-heading-status').text('');
	var data = '';
	$('.items').each(function() {
		data += $(this).find('h4').text() + '\r\n';
		$(this).find('div p').each(function() {
			data += $(this).text() + '\r\n';
		});
		data += '\r\n';
	});
	return data;
}

/**********************************************************
 * google drive functions
 */
function fileDownload(fileid, callback) {
	drive.download(fileid, function(status, data) {
		if (status === 200) {
			// return downloaded data
			callback(data);
		} else {
			// download failed
			// return cached data
			callback(app.file.data);
		}
	});
}

function fileUpload(fileid, data, callback) {
	var blob = new Blob([data], {'type':'text/plain'});
	blob.name = app.file.name,
	drive.upload(fileid, blob, function(response) {
		if (callback) {
			callback(response);
		}
	});
}

function fileTrash(fileid, callback) {
	drive.trash(fileid, function(status, data) {
		if (status === 200) {
			callback(data);
		}
	});
}

function fileList(callback) {
	drive.list("mimeType='text/plain' and trashed=false", function(status, data) {
		if (status === 200) {
			callback(data);
		}
	});
}

/**********************************************************
 * menu handlers
 */

function newFile() {
	displayMessage(
		'Enter a name for the new file:',
		'New File', MSG_CANCEL | MSG_INPUT, function() {
			var filename = $('#messageInput').val();
			if (filename.length > 0) {
				app.file.name = filename;
				app.file.id = null;
				renderData(filename, "\r\n");
				addItem();
				app.file.data = serializeData();
				fileUpload(null, app.file.data, function(response) {
					app.file.id = JSON.parse(response).id;
					saveConfig();
					console.log("Created file: " + app.file.id);
				});
			}
		});
	$('#messageInput').focus();
}

function openFile() {
	fileList(function(data) {
		var options = '';
		$.each(JSON.parse(data).items, function(key, item) {
			options += '<option value="' + item.id + '">' + item.title + '</option>';
		});
		$('#messageSelect-button span').text('');
		$('#messageSelect').html(options).selectmenu();
	});
	displayMessage(
		'Select a file to open:',
		'Open File', MSG_CANCEL | MSG_SELECT, function() {
			var filename = $('#messageSelect-button span').text();
			var fileid = $('#messageSelect').val();
			if(filename.length > 0) {
				$('#itemList').html("Loading file...");
				app.file.id = fileid;
				app.file.name = filename;
				saveConfig();
				loadFile();
			}
		});
}

function saveFile() {
	if (app.file.id) {
		app.file.data = serializeData();
		fileUpload(app.file.id, app.file.data);
		saveConfig();
	}
}

function deleteFile() {
	displayMessage(
		'Are you sure you want to delete this file?',
		'Confirm Delete', MSG_CANCEL, function() {
			// delete file
			fileTrash(app.file.id, function() {
				// remove filename
				app.file.id = null;
				app.file.name = null;
				app.file.data = null;
				saveConfig();
				// render empty data
				$('#fileLabel').text('');
				$('#itemList').html('');
			});
		});
}

function importFile() {
	// display html file input dialog
	$('<input type="file" accept="text/*">').change(function() {
		$('#itemList').html("Loading file...");
		// read data from selected file
		var file = $(this)[0].files[0];
		var reader = new FileReader();
		reader.onload = function() {
			// save data
			app.file.id = null;
			app.file.name = file.name;
			app.file.data = reader.result;
			renderData(app.file.name, app.file.data);
			fileUpload(null, app.file.data, function(response) {
				app.file.id = JSON.parse(response).id;
				saveConfig();
				console.log("Created file: " + app.file.id);
			});
		};
		reader.readAsText(file);
	}).click();
}

function exportFile() {
	var data = serializeData();
	if (data.length === 0) {
		return;
	}
	// download file
	var blob = new Blob([data]);
	$(this).attr('href', window.URL.createObjectURL(blob));
	$(this).attr('download', app.filename);
}

function editItem() {
	var item = $('.items:not(.ui-collapsible-collapsed)');
	if (item.length > 0) {
		// set to editable and save on focusout
		item.attr('contenteditable', 'true').focus().focusout(saveFile);
	} else {
		displayMessage(
			'Unable to edit. No item was selected.',
			'Edit', MSG_OK);
	}
}

function addItem() {
	var item = '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4><div>New</div></h4><p><br></p></div>';
	$('#itemList').append(item).enhanceWithin();
	$('.items').last().collapsible('expand').focus().focusout(saveFile);
}

function removeItem() {
	var item = $('.items:not(.ui-collapsible-collapsed)');
	if (item.length > 0) {
		displayMessage(
			'Are you sure you want to delete this item?',
			'Confirm Delete', MSG_CANCEL, function() {
				item.remove();
				saveFile();
			});
	} else {
		displayMessage(
			'Unable to delete. No item was selected.',
			'Delete', MSG_OK);
	}
}

/**********************************************************
 * helper functions
 */
var MSG_OK = 1;
var MSG_CANCEL = 2;
var MSG_INPUT = 4;
var MSG_SELECT = 8;

function displayMessage(message, header, type, callback) {
	$('#messageText').html(message);
	$('#messageHeader').html(header);

	$('#messageCancel').toggle(Boolean(type & MSG_CANCEL));
	$('#messageInput').parent().toggle(Boolean(type & MSG_INPUT));
	$('#messageSelect').parent().toggle(Boolean(type & MSG_SELECT));

	$('#messageOk').unbind();
	$('#messageOk').click(callback);
	$('#messageBox').popup('open');
}

function errorHandler(message, display) {
	console.log(message);
	if (display) {
		displayMessage(message, 'Error');
	}
}

/**********************************************************
 * event handlers
 */

$(window).load(init);
$('#menuNew').click(newFile);
$('#menuOpen').click(openFile);
$('#menuSave').click(saveFile);
$('#menuDelete').click(deleteFile);
$('#menuImport').click(importFile);
$('#menuExport').click(exportFile);
$('.menuAddItem').click(addItem);
$('.menuEditItem').click(editItem);
$('.menuRemoveItem').click(removeItem);
$('#menuSignout').click(signOut);
$('#buttonSignin').click(signIn);
$('#buttonLocal').click(localOnly);

}); //end jQuery
