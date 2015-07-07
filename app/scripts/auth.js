
/******************************************************************
/* http://tipstak.blogspot.com/2015/02/How-to-make-Google-Drive-Chrome-packaged-apps-without-gapi.html

<button id="btn_auth">auth</button>
<div id="div_status">Not Authorized.</div>
<hr>
filename: <input type="text" id="txt_filename" value="test.txt"><br>
content:<br>
<textarea id="ta_content"></textarea><br>
<button id="btn_upload">upload</button>
<hr>
<button id="btn_download">download</button><br>
content: <div id="div_dl"></div>

******************************************************************/

var accessToken;

var btn_auth = document.getElementById("btn_auth");
var btn_upload = document.getElementById("btn_upload");
var btn_download = document.getElementById("btn_download");
var txt_filename = document.getElementById("txt_filename");
var ta_content = document.getElementById("ta_content");
var div_status = document.getElementById("div_status");
var div_dl = document.getElementById("div_dl");

btn_auth.onclick = function(e) {
  console.log("btn_auth click");
  auth(true, function() {
    console.log("accessToken", accessToken);
    div_status.textContent = "Authorized.";
  })
};

btn_upload.onclick = function(e) {
  console.log("btn_upload click");
  getFileOnGDrive(txt_filename.value, upload);
};

btn_download.onclick = function(e) {
  console.log("btn_download click");
  getFileOnGDrive(txt_filename.value, download);
};

function auth(interactive, opt_callback) {
  try {
    chrome.identity.getAuthToken({
      interactive: interactive
    }, function(token) {
      if (token) {
        accessToken = token;
        opt_callback && opt_callback();
      }
    });
  } catch (e) {
    console.log(e);
  }
};

function upload(file) {
  var filename;
  var mimeType = "text/plain";
  if (file) {
    filename = file.title;
  } else {
    filename = txt_filename.value;
  }

  // create contents.
  var txt = ta_content.value;
  var content = new Blob([txt], {
    "type": mimeType
  });

  var onComplete = function(response) {
    console.log("upload complete. response=", response);
    // var json = JSON.parse(response);
  };

  var onError = function(response) {
    console.log("upload error. response=", response);
  }

  //
  // upload
  //
  var upload_opts = {
    metadata: {
      title: filename,
      mimeType: mimeType
    },
    file: content,
    token: accessToken,
    onComplete: onComplete,
    onError: onError
  };
  // if the file has already existed, set the fileId to options param
  if (file) upload_opts.fileId = file.id;
  var uploader = new MediaUploader(upload_opts);
  uploader.upload();
}

function download(file) {
  var xhr = new XMLHttpRequest();
  var url = "https://www.googleapis.com/drive/v2/files";
  if (file) {
    // get url for download
    url = file.downloadUrl;
  }
  xhr.open('GET', url);
  xhr.setRequestHeader('Authorization',
    'Bearer ' + accessToken);
  xhr.onreadystatechange = function(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // get the file's content.
      console.log("xhr.responseText", xhr.responseText);
      div_dl.textContent = xhr.responseText;
    } else if (xhr.readyState == 4 && xhr.status != 200) {
      console.error("Error: status=", xhr.status);
    }
  };
  xhr.onerror = function(e) {
    console.error("Error: ", e);
  };
  xhr.send();
}

function getFileOnGDrive(filename, callback) {
  var xhr = new XMLHttpRequest();
  var url = "https://www.googleapis.com/drive/v2/files";
  xhr.open('GET', url);
  xhr.setRequestHeader('Authorization',
    'Bearer ' + accessToken);
  xhr.onreadystatechange = function(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var json = JSON.parse(xhr.responseText);
      var filename = txt_filename.value;
      var file = getFile(filename, json.items);
      callback(file);
      return;
    } else if (xhr.readyState == 4 && xhr.status != 200) {
      console.error("Error: status=", xhr.status);
    }
  };
  xhr.onerror = function(e) {
    console.error("Error: ", e);
  };
  xhr.send();

  // get the file having same filename and create url for downloading it
  function getFile(filename, items) {
    var item;
    for (var len = items.length, i = 0; i < len; i++) {
      item = items[i];
      if (item.title == filename) {
        return item;
      }
    }
    return null;
  }
}
