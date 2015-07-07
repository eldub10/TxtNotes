
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
	readFile(filename, function(data) {
		if (data.length > 0) {
			renderData(filename, data);
		}
	});
}

function renderData(filename, data) {
	var items = '';
	var counter = 0;
	var lines = data.split('\r\n');
	//TODO: normalize line endings

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

function openFile() {
	// dynamically create an input element to allow file selection
	// load data from the choosen file
	// upload file to Google drive
	$('<input type="file">').change(function() {
		var file = $(this)[0].files[0];
		var reader = new FileReader();
		reader.onload = function() {
			// set filename in local storage
			chrome.storage.local.set({'filename': file.name});
			// render data in html
			renderData(file.name, reader.result);
			// save file to SyncFileSystem
			saveFile(file.name, reader.result);
		};
		reader.readAsText(file);
	}).click();
}

function saveFile() {
	// get data from html and format as string with line breaks
	var filename = $('#fileLabel').text();
	$('.ui-collapsible-heading-status').text('');
	var data = '';
	$('.items').each(function() {
		data += $(this).find('h4').text() + '\r\n';
		$(this).find('div p').each(function() {
			data += $(this).text() + '\r\n';
		});
		data += '\r\n';
	});

	writeFile(filename, data, function(error) {
		errorMessage(error);
	});
}

function addItem() {
	var item = '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4>New</h4><p><br></p></div>';
	$('#itemList').append(item).enhanceWithin();
}

function deleteItem() {
	var item = $('.items:not(.ui-collapsible-collapsed)');
	if (item.length > 0) {
		displayMessage(
			'Are you sure you want to delete this item?',
			'Confirm Delete', true, function() {
				item.remove();
			});
	} else {
		displayMessage(
			'Unable to delete. No item was selected.',
			'Delete');
	}
}

function readFile(filename, callback) {
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

function writeFile(filename, data, callback) {
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

function displayMessage(message, header, showCancel, callback) {
	$('#messageText').html(message);
	$('#messageHeader').html(header);
	$('#messageCancel').toggle(showCancel);
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

// Event handlers
$(window).load(init);
$('#menuOpen').click(openFile);
$('#menuSave').click(saveFile);
$('#menuAdd').click(addItem);
$('#menuDelete').click(deleteItem);


/**
 * TODO:
 * - add New File menu item
 *     - dialog box for title
 * - change Open File
 *     - display dialog box with list of files (from syncFileSystem)
 * - add Import File (currently openFile)
 * - add Export File
 * - add Delete File
 */