
/**********************************************************
 * main
 */

var app = {
	'filename': '',
	'storage': chrome.storage.local
}

function init() {
	// look for filename in local storage
	getFilename(function(filename) {
		if (filename && filename.length > 0) {
			app.filename = filename;
			loadFile(app.filename);
		}
	});
}

function loadFile(filename) {
	getFile(filename, function(data) {
		if (data) {
			renderData(filename, data);
		}
	});
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
 * sync storage functions
 */

function getFilename(callback) {
	app.storage.get('filename', function(value) {
		callback(value.filename);
	});
}

function setFilename(filename) {
	app.filename = filename;
	app.storage.set({'filename': filename});

	getFileList(function(files) {
		if (files.indexOf(app.filename) === -1) {
			files.push(app.filename);
			app.storage.set({'files': files});
		}
	});
}

function removeFilename() {
	getFileList(function(files) {
		var index = files.indexOf(app.filename);
		if (index >= 0) {
			files.splice(index, 1);
			app.storage.set({'files': files});
		}
		app.storage.set({'filename': ''});
		app.filename = '';
	});
}

function getFileList(callback) {
	app.storage.get('files', function(value) {
		return callback(value.files || []);
	});
}

function getFile(filename, callback) {
	app.storage.get(filename, function(value) {
		callback(value[filename]);
	});
}

function setFile(filename, data) {
	var params = {};
	params[filename] = data;
	app.storage.set(params);
}

function removeFile(filename) {
	app.storage.remove(filename);
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
			renderData(filename, "New\r\n");
		});
	$('#messageInput').focus();
}

function openFile() {
	getFileList(function(files) {
		var options = '';
		for(var i = 0; i < files.length; i++) {
			options += '<option>' + files[i] + '</option>';
		}
		$('#messageSelect-button span').text('');
		$('#messageSelect').html(options).selectmenu();
	});
	displayMessage(
		'Select a file to open:',
		'Open File', MSG_CANCEL | MSG_SELECT, function() {
			var filename = $('#messageSelect-button span').text();
			if(filename.length > 0) {
				setFilename(filename);
				loadFile(filename);
			}
		});
}

function saveFile() {
	if (app.filename.length === 0) {
		$('#messageInput').val(app.filename);
		displayMessage(
			'Enter a filename:',
			'Save As', MSG_CANCEL | MSG_INPUT, function() {
				setFilename($('#messageInput').val());
				setFile(app.filename, serializeData());
			});
	}
	setFile(app.filename, serializeData());
}

function deleteFile() {
	displayMessage(
		'Are you sure you want to delete this file?',
		'Confirm Delete', MSG_CANCEL, function() {
			// delete file
			removeFile(app.filename);
			// remove filename
			removeFilename();
			// render empty data
			$('#fileLabel').text('');
			$('#itemList').html('');
		});
}

function importFile() {
	// display html file input dialog
	$('<input type="file" accept="text/*">').change(function() {
		// read data from selected file
		var file = $(this)[0].files[0];
		var reader = new FileReader();
		reader.onload = function() {
			// save data
			setFilename(file.name);
			renderData(file.name, reader.result);
			saveFile(file.name, reader.result);
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

function errorMessage(message, display) {
	console.log(message);
	if (display) {
		displayMessage(message, "Error");
	}
}

// watch for changes in the itemlist and save them
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

