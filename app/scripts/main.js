
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
			getFile(filename, function(data) {
				if (data) {
					renderData(filename, data);
				}
			});
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

function saveFile() {
	if (app.filename.length > 0) {
		$('.items').removeAttr('contenteditable');
		setFile(app.filename, serializeData());
	}
}

function openFile() {
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

function editItem() {
	var item = $('.items:not(.ui-collapsible-collapsed)');
	if (item.length > 0) {

		// set to editable
		item.attr('contenteditable', 'true');

		// don't scroll to top
		$('html, body').scrollTop(item.offset().top - 42);

	} else {
		displayMessage(
			'Unable to edit. No item was selected.',
			'Edit', MSG_OK);
	}
}

function addItem() {
	var item = '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4><div>New</div></h4><p><br></p></div>';
	$('#itemList').append(item).enhanceWithin();
	$('.items').last().collapsible('expand');
	$('html, body').animate({
		scrollTop: $('.items').last().offset().top
	});
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

function errorHandler(message, display) {
	console.log(message);
	if (display) {
		displayMessage(message, "Error");
	}
}

/**********************************************************
 * event handlers
 */

$(window).load(init);
$('#menuOpen').click(openFile);
$('#menuSave').click(saveFile);
$('#menuAddItem').click(addItem);
$('#menuEditItem').click(editItem);
$('#menuRemoveItem').click(removeItem);
