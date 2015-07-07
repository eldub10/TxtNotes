
/**
 * Main
 */

function init() {
	// look for filename in local storage
	getStorage('filename', function(filename) {
		loadFileFromGoogleDrive(filename);
	});
}

function saveFileToGoogleDrive(filename, data) {
	//TODO:
	// check if file already exists
	// confirm replacement
	// call upload api
}

function loadFileFromGoogleDrive(fileid) {
	if (fileid.length == 0) {
		return;
	}
	// TODO: replace mock data
	$.ajax({
		url: fileid,
		success: function(data) {
			error('Loading data from Google drive.');
			loadData(fileid, data);
		},
		error: function() {
			error('Error loading from Google drive. Loading data from local storage instead.');
			loadFileFromStorage(fileid);
		}
	});
}

function loadFileFromStorage(filename) {
	getStorage(filename, function(data) {
		if (data.length == 0) {
			error('Unable to load file from local storage.');
		}
		loadData(filename, data);
	});
}

function getStorage(name, callback) {
	chrome.storage.local.get(name, function(value) {
		callback(value[name]);
	});
}

function setStorage(name, value) {
	var params = {};
	params[name] = value;
	chrome.storage.local.set(params);
}

function loadData(filename, data) {
	// set filename in titlebar
	$('#fileLabel').text(filename);

	// set filename in local storage
	setStorage('filename', filename);

	// cache data in local storage
	setStorage(filename, data);

	// render data in html
	renderData(data);
}

function renderData(data) {
	var items = '';
	var counter = 0;
	var lines = data.split('\r\n');

	// loop through each line of file and create html elements:
	/*
	<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false">
		<h4>Line one (title)</h4>
		<p>Line two</p>
		<p>Line three</p>
		<p>Etc...</p>
	</div>
	*/
	for (var i = 0; i < lines.length; i++) {
		if(lines[i].length > 0) {
			if(counter === 0) {
				items += '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4>' + lines[i] + '</h4>';
			} else {
				items += '<p>' + lines[i] + '</p>';
			}
			counter++;
		} else {
			if(counter > 0) {
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
			loadData(file.name, reader.result);
			saveFileToGoogleDrive(file.name, reader.result);
		};
		reader.readAsText(file);
	}).click();
}

function saveFile() {
	// get data from html and format as string with line breaks
	// TODO: move to separate function
	// TODO: add handler for saving when file is closed
	// TODO: add handler for saving when div is collapsed
	$('.ui-collapsible-heading-status').text('');
	var data = '';
	$('.items').each(function() {
		data += $(this).find('h4').text() + '\r\n';
		$(this).find('p').each(function() {
			data += $(this).text() + '\r\n';
		});
		data += '\r\n';
	});

	var filename = $('#fileLabel').text();
	setStorage(filename, data); //TODO: should this be here?
}

function addItem() {
	var item = '<div class="items" data-role="collapsible" contenteditable="true" spellcheck="false"><h4>New</h4><p></p></div>';
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

function closeApp() {
	// TODO: testing only
	setStorage('close', 'true');
}

function displayMessage(message, header, showCancel, callback) {
	$('#messageText').html(message);
	$('#messageHeader').html(header);
	$('#messageCancel').toggle(showCancel);
	$('#messageOk').click(callback);
	$('#messageBox').popup('open');
}

function error(message, display) {
	console.log(message);
	if (display) {
		displayMessage(message, "Error");
	}
}

init();
$('#menuOpen').click(openFile);
$('#menuSave').click(saveFile);
$('#menuAdd').click(addItem);
$('#menuDelete').click(deleteItem);

/************************************************************************************
* TINKER
************************************************************************************/

$('#fileLabel').click(function() {
	// $('#sandbox').get(0).contentWindow.postMessage('message from main.js', '*');
	Dropbox.choose();
});

window.addEventListener('message', function(event) {
	console.log(event.data);

});

// function showPicker() {
// 	chrome.app.window.create('sandbox.html', {
// 		id: 'picker',
// 		bounds: {width: 1050, height: 650}
// 	}, function(createdWindow) {
// 		picker = createdWindow;
// 		picker.contentWindow.postMessage('message from main.js', '*');
// 	});
// }
