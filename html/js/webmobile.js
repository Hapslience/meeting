
document.ontouchmove = function(e){ e.preventDefault(); }
        
var ERR_CODE_NOT_LOGIN = 1;
var LOCAL_SERVER = "http://localhost/web-mobile/";
var AWS_SERVER = "http://ec2-52-74-36-119.ap-southeast-1.compute.amazonaws.com/web-mobile/";
var SERVER_IP_ADDRESS = LOCAL_SERVER;
$(function(){
	
	$("body>[data-role='panel']" ).panel();
	
	mainPageLoad();
	$('#login').tap(function(){
    var userName = $('#userName').val();
	var passWord = $('#passWord').val();
	if (userName != "" && passWord != "")  {
		var obj = {userName:userName, passWord:passWord}
		login(obj);
	}
  });
  
  	$('#reg').tap(function(){
	console.log("23333");
    var userName = $('#userName').val();
	var passWord = $('#passWord').val();
	if (userName != "" && passWord != "") {
	  sendjson('register', {"userName":userName, "passWord":passWord}, registerOk, loginError)
	}
  });
  
    $('#logout').tap(function(){
	   sendjson('logout', {}, logoutOk, loginError)
  });
  
	// $('toUserDetailInfo').tap(buildUserInfoPage);
	$('#toUserDetailInfo').tap(buildUserInfoPage);
	$('#toUserInfo').tap(checkUserInfo);
	$('#toGroupInfo').tap(checkUserInfo);
	$('#toCreateGroup').tap(checkUserInfo);
	$('#changePassWordSubmit').tap(changePassWord);
	$('#createGroupSubmit').tap(createGroupSubmit);
	$('#uploadFileSubmit').tap(upLoadFile);
	
	// $('#toGroupListInfo').tap(buildGroupInfoList);
	
	 $('#main').on("pagebeforeshow", mainPageLoad);
	 $('#groupInfoListPage').on("pagebeforeshow", buildGroupInfoList);
	 $('#fileDownloadPage').on("pagebeforeshow", buildFileDownloadList);
	 
	  $('#fileSharingForm').on('submit', upLoadFile);
	
	
	


  
});

function mainPageLoad(event, data) {
	console.log("main");
	if (typeof localStorage.user == 'undefined') {
		localStorage.user = "{}";
		$('#loginInfoLable').hide();
	}

	var user = JSON.parse(localStorage.user || '{}');
	
	if (user != null && typeof user.userName != 'undefined') {
		$('#logout').show();
        $('#login').hide();
		
		$('#loginInfoLable').text("welcome," + user.userName);
		$('#loginInfoLable').show();		
	} else {
		sendjson('reconnect', {}, reconnectOk);
		$('#login').show();
        $('#logout').hide();
		$('#loginInfoLable').hide();
	}
}

function login(obj) {
	  sendjson('login', obj, loginOk, loginError);
}

function loginOk(obj) {
	if (obj.ok == true) {
		alert("登录成功");
		localStorage.user = JSON.stringify(obj.user);
		moveToMainPage();
	} else {
		alert(obj.errMsg);
	}
}

function reconnectOk(obj) {
	if (obj.ok == true) {
		localStorage.user = JSON.stringify(obj.user);
		location.reload();
	}
}

function registerOk(obj) {
	if (obj.ok == true) {
		alert("注册成功");
		// 注册成功自动登录
		var userName = $('#userName').val();
		var passWord = $('#passWord').val();
		if (userName != "" && passWord != "")  {
			var obj = {userName:userName, passWord:passWord}
			login(obj);
		}
	} else {
		alert(obj.errMsg);
	}
}

function logoutOk(obj) {
	if (obj.ok == true) {
		alert("成功退出登录");
	} else {
		alert(obj.errMsg);
	}
	clearLoginInfo();
	location.reload();
}


function loginError() {
	alert("连接失败");
}

function buildUserInfoPage() {
	// 构造用户信息页面
	var user =  checkUserInfo();
	if (user != null) {
		$('#userNameInPage').text(user.userName);
		$('#lastLoginTime').text(user.lastLoginTime);
		$('#regTime').text(user.regTime);
	}
	
}

function buildGroupInfoList(event, data) {
	checkUserInfo();
	var i;  
	var objListView = document.getElementById("groupInfoList");
	objListView.innerHTML = "";    //清空ListView原本的内容
	
	var param = {};
	
	// 从服务器获取数据
	sendjson("getGroupInfo", param, function(obj) {
			if (obj.ok == true) {
				var groupInfoList = obj.userGroupList;
				for (var i in groupInfoList) {
					var groupInfo = groupInfoList[i];
					var groupName = groupInfo.name;
					var groupItemId = "item_" + i;
					var item = "<li><a  id = "+ groupItemId +" href=#groupInfoPanel>" + groupName + "</a></li>";
					$("#groupInfoList").append(item);
					// groupInfoPanelTitle = "<h3 id = \"groupInfoPanelTitle\">"+ groupName +"</h3>"
					$("#" + groupItemId).on("tap",function(){
						var groupInfoPanelTitle = document.getElementById("groupInfoPanelTitle");
						groupInfoPanelTitle.innerHTML =  ""; 
						$("#groupInfoPanelTitle").text(this.text);
						console.log(groupInfoPanelTitle);
					});  


				}
			} else {
				$("#groupInfoList").append('<h4>' + obj.errMsg +'</h4>');
			}
			$('#groupInfoList').listview('refresh');  
	});
	// for( i = 0; i <= 3; i++) {  
		// var list = $("<li><a>aaa" + i + "</a></li>"); 
		// alert('2333' + i);		
		// $("#groupInfoList").append("<li><a>aaa" + i + "</a></li>");  
		
	// }  

}

function buildFileDownloadList(event, data) {
	var isLogin = checkUserInfo();
	if (isLogin != false) {
		var i;  
		var objListView = document.getElementById("fileDownLoadList");
		objListView.innerHTML = "";    //清空ListView原本的内容
		// 从服务器获取数据
		var param = {};
		sendjson("getUserFileList", param, function(obj) {
			if (obj.ok == true) {
				var fileInfoList = obj.fileInfoList;
				for (var i in fileInfoList) {
					var fileInfo = fileInfoList[i];
					var fileName = fileInfo.fileName;
					var fileItemId = "item_" + i;
					var itemHtml = "<li><a  id = "+ fileItemId +">" + fileName + "</a></li>";
					$("#fileDownLoadList").append(itemHtml);
					var item = document.getElementById(fileItemId);
					item.setAttribute("href", fileInfo.url);
				}
			} else {
				$("#fileDownLoadList").append('<h4>' + obj.errMsg +'</h4>');
			}	
		$('#fileDownLoadList').listview('refresh');  
		});
	}
	
}

function changePassWord() {
	checkUserInfo();
	var oldPassWord = $('#oldPassWord').val();
	var newPassWord = $('#newPassWord').val();
	var obj = {oldPassWord : oldPassWord, newPassWord : newPassWord};
	console.log(obj);
	if (newPassWord != $('#newPassWordAg').val()) {
		alert("两次输入密码不一致");
	} else {
		sendjson("changePassWord", obj, function(obj) {
			if (obj.ok == true) {
				alert("修改成功");
				moveToMainPage();
			} else {
				alert(obj.errMsg);
			}
		});
	}
	
}

function createGroupSubmit() {
	var formData = $("#createGroupInfoForm").serialize(); 
	console.log(formData);
	sendjsonByText("createGroupInfo", formData, function(obj) {
		if (obj.ok == true) {
			alert("创建成功");
			moveToMainPage();
		} else {
			alert(obj.errMsg);
		}
	})
}

function upLoadFile() {
	console.log("2333");
	$('#fileSharingForm').ajaxSubmit({
		url:SERVER_IP_ADDRESS+"uploadFile",
		type:'POST',
		contentType:'multipart/form-data',
		success:function(result){
		  if (result.errcode == ERR_CODE_NOT_LOGIN) {
			  alert("您尚未登录");
			  clearLoginInfo();
		  } else {
			  alert("上传成功");
		  }
		},
		failure:function(){
		  fail && fail();
		}
	});
}

function checkUserInfo() {
	var user = JSON.parse(localStorage.user || '{}');
	if (user != null && typeof user.userName != 'undefined') {
		return user;
	} else {
		alert("您尚未登录");
		clearLoginInfo();
		return false;
	}
}

function clearLoginInfo() {
	// 清除本地登录信息
	localStorage.user = "{}";
	moveToMainPage();
}

function moveToMainPage(){
	$.mobile.changePage("#main", {reloadPage : true, transition : "slideup"}); 
	// location.reload();
}



function sendjson(urlsuffix,obj,win,fail) {
  $.ajax({
    url:SERVER_IP_ADDRESS+urlsuffix,
    type:'POST',
    contentType:'application/json',
    dataType:'json',
    data:JSON.stringify(obj),
    success:function(result){
	  if (result.errcode == ERR_CODE_NOT_LOGIN) {
		  alert("您尚未登录");
		  clearLoginInfo();
	  } else {
		  win && win(result);
	  }
    },
    failure:function(){
      fail && fail();
    }
  });
}

function sendjsonByText(urlsuffix,text,win,fail) {
  $.ajax({
    url:SERVER_IP_ADDRESS+urlsuffix,
    type:'POST',
    contentType:'application/x-www-form-urlencoded',
    dataType:'text',
    data:text,
    success:function(result){
	  var obj = JSON.parse(result);
	  if (obj.errcode == ERR_CODE_NOT_LOGIN) {
		  alert("您尚未登录");
		  clearLoginInfo();
	  } else {
		  win && win(obj);
	  }
    },
    failure:function(){
      fail && fail();
    }
  });
}

function sendjsonByUpLoadFile(urlsuffix,file,win,fail) {
  $.ajax({
    url:SERVER_IP_ADDRESS+urlsuffix,
    type:'POST',
    contentType:'multipart/form-data',
    data:file,
    success:function(result){
	  var obj = JSON.parse(result);
	  if (obj.errcode == ERR_CODE_NOT_LOGIN) {
		  alert("您尚未登录");
		  clearLoginInfo();
	  } else {
		  win && win(obj);
	  }
    },
    failure:function(){
      fail && fail();
    }
  });
}

