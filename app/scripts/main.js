
/**
 * Main
 */
function init() {
	// look for filename in local storage
	chrome.storage.local.get('filename', function(value) {
		loadFile(value.filename);
	});
}

function loadFile(filename) {
	if (filename.length == 0) {
		return;
	}
	readSyncFile(filename, function(data) {
		if (data.length > 0) {
			renderData(filename, data);
		}
	});
}

function renderData(filename, data) {
	// clear existing data
	if (!filename && !data) {
		$('#fileLabel').text('');
		$('#itemList').html('');
		return;
	}

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
				items += '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4>' + lines[i] + '</h4>';
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

function getFilename() {
	return $('#fileLabel').text();
}

function setFilename(filename) {
	chrome.storage.local.set({'filename': filename});
	$('#fileLabel').text(filename);
}

/**********************************************************
 * menu handlers
 */

function newFile() {
	displayMessage(
		'Enter a name for the new file:',
		'New File', MSG_CANCEL | MSG_INPUT, function() {
			var filename = $('#messageInput').val();
			setFilename(filename);
			renderData();
		});
}

function openFile() {
	chrome.storage.local.get('files', function(value) {
		var files = value.files || [];
		var options = '';
		for(var i = 0; i < files.length; i++) {
			options += '<option>' + files[i] + '</option>';
		}
		$('#messageSelect').html(options).selectmenu();
	});
	displayMessage(
		'Name of file to open:',
		'Open File', MSG_CANCEL | MSG_SELECT, function() {
			var filename = $('#messageSelect-button span').text();
			setFilename(filename);
			loadFile(filename);
		});
}

function saveFile() {
	var data = serializeData();
	var filename = getFilename();

	// add filename to array of saved files
	chrome.storage.local.get('files', function(value) {
		var files = value.files || [];
		if (files.indexOf(filename) == -1) {
			files.push(filename);
			chrome.storage.local.set({'files': files});
		}
	});
	// save the file
	writeSyncFile(filename, data);
}

function deleteFile() {
	displayMessage(
		'Are you sure you want to delete this file?',
		'Confirm Delete', MSG_CANCEL, function() {
			var filename = getFilename();
			// delete file
			deleteSyncFile(filename, function() {

				// remove filename from array of saved files
				chrome.storage.local.get('files', function(value) {
					var files = value.files || [];
					var index = files.indexOf(filename);
					if (index >= 0) {
						files.splice(index, 1);
						chrome.storage.local.set({'files': files});
					}
				});
				// render empty data
				renderData();
			});
		});
}

function importFile() {
	// load data from the choosen file
	// save in syncFileSystem
	$('<input type="file">').change(function() {
		var file = $(this)[0].files[0];
		var reader = new FileReader();
		reader.onload = function() {
			// set filename in local storage
			setFilename(file.name);
			// render data in html
			renderData(file.name, reader.result);
			// save file to syncFileSystem
			saveFile(file.name, reader.result);
		};
		reader.readAsText(file);
	}).click();
}

function exportFile() {
	var data = serializeData();
	if (data.length == 0) {
		return;
	}
	var filename = getFilename();
	// download file
	var blob = new Blob([data]);
	$(this).attr('href', window.URL.createObjectURL(blob));
	$(this).attr('download', filename);
}

function addItem() {
	var item = '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4>New</h4><p><br></p></div>';
	$('#itemList').append(item).enhanceWithin();
}

function removeItem() {
	var item = $('.items:not(.ui-collapsible-collapsed)');
	if (item.length > 0) {
		displayMessage(
			'Are you sure you want to delete this item?',
			'Confirm Delete', MSG_CANCEL, function() {
				item.remove();
			});
	} else {
		displayMessage(
			'Unable to delete. No item was selected.',
			'Delete', MSG_OK);
	}
}

/**********************************************************
 * syncFileSystem functions
 */

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

function readSyncFile(filename, callback) {
	chrome.syncFileSystem.requestFileSystem(function(fs) {
		fs.root.getFile(filename, null, function(fileEntry) {
			fileEntry.file(function(fileObject) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					callback(e.target.result);
				}
				reader.readAsText(fileObject);
			});
		});
	});
}

function writeSyncFile(filename, data, callback) {
	chrome.syncFileSystem.requestFileSystem(function(fs) {
		fs.root.getFile(filename, {create:true}, function(fileEntry) {
			fileEntry.createWriter(function(writer) {
				writer.onwriteend = function(e) {
					writer.onwriteend = null;
					writer.truncate(e.total);
				}
				writer.onerror = function(e) {
					callback(e);
				}
				var blob = new Blob([data]);
				writer.write(blob);
			});
		});
	});
}

function deleteSyncFile(filename, callback) {
	chrome.syncFileSystem.requestFileSystem(function(fs) {
		fs.root.getFile(filename, null, function(fileEntry) {
			fileEntry.remove(function() {
				callback();
			});
		});
	});
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
	$('#messageInput').val('');

	$('#messageCancel').toggle(Boolean(type & MSG_CANCEL));
	$('#messageInput').parent().toggle(Boolean(type & MSG_INPUT));
	$('#messageSelect').parent().toggle(Boolean(type & MSG_SELECT));

	$('#messageOk').unbind();
	$('#messageOk').click(callback);
	$('#messageBox').popup('open');
}

function errorMessage(message, display) {
	console.log(message);
	if (display) {
		displayMessage(message, "Error");
	}
}

// watch for changes (edits) in the item list and save them
$('#itemList').delegate('.items', 'focus', function(){
	$('.ui-collapsible-heading-status').text('');
    $(this).data('before', $(this).text());
});
$('#itemList').delegate('.items', 'blur', function(){
	$('.ui-collapsible-heading-status').text('');
    if($(this).data('before') != $(this).text()){
        saveFile();
    }
});

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
$('#menuAddItem').click(addItem);
$('#menuRemoveItem').click(removeItem);

