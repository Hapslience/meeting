
var MEETING_INFO_SELECTED = "meetingInfo";
var MANAGED_MEETING_INFO_SELECTED = "managedMeetingInfo";
var SCHEDULE_INFO_SELECTED = "scheduleInfo";
var DEFAULT_POINT = {x : 116.404, y : 39.915};


var common = {};
common.setLocalStorage = function setLocalStorage(name, obj) {
	var jsonStr = JSON.stringify(obj);
	localStorage[name] = jsonStr;
};

common.getLocalStorage = function getLocalStorage(name) {
	var obj = JSON.parse(localStorage[name] || '{}');
	return obj;
}

common.loading = function() {
	console.log("loadingShow:" + $.mobile.loader.prototype.options.text);
 	$.mobile.loading( "show", {
            text: $.mobile.loader.prototype.options.text,
            textVisible:  "true",
            theme: "",
            textonly: false,
            html: ""
    });

}   

common.stopLoading = function() {
	console.log("loadinghide");
	$.mobile.loading( "hide" );
}  

//doc icon
var docIconArr = [];
docIconArr.push({etc : ".jpg", filePath :"img/Filetype_JPG.png"});
docIconArr.push({etc : ".mov", filePath :"img/Filetype_MOV.png"});
docIconArr.push({etc : ".mp3", filePath :"img/Filetype_MP3.png"});
docIconArr.push({etc : ".pdf", filePath :"img/Filetype_PDF.png"});
docIconArr.push({etc : ".rar", filePath :"img/Filetype_RAR.png"});
docIconArr.push({etc : ".wav", filePath :"img/Filetype_WAV.png"});
docIconArr.push({etc : ".zip", filePath :"img/Filetype_Zip.png"});
docIconArr.push({etc : ".doc", filePath :"img/Word.png"});
common.getFileIcon = function(fileName) {
	var fileType=fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
	console.log("fileName " + fileName);
	console.log("fileType " + fileType);
	for (var i in docIconArr) {
		if (fileType == docIconArr[i].etc) {
			return  docIconArr[i].filePath;
		}
	}
	return "img/Word.png";
}

   

