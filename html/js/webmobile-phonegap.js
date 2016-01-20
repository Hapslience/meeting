
// document.ontouchmove = function(e){ e.preventDefault(); }
        
var ERR_CODE_NOT_LOGIN = 1;
var groupInfoSelected=null;
// 服务器地址

// 申请加入组织状态
var CREATER = 1;
var NORMAL_MEMBER = 2;
var TO_BE_ACCEPTED = 0;

var LOCAL_SERVER = "http://localhost/web-mobile/";

var SERVER_IP_ADDRESS = LOCAL_SERVER;




$(function(){
	mainPageLoad();
	$(document).on('ajaxStart', function () {  
		setTimeout(function () {  
			common.loading();  
		}, 1);  
	}).on('ajaxStop', function () {  
		common.stopLoading();
	});  
	/*$("#s").ajaxStart(function(){
		$(this).show().html("正在发送请求");
	})
	$("s").ajaxStop(function(){
		$("this").show().html("请求完成");
	})*/
	$('#login').click(function(){
    var userName = $('#userName').val();
	var passWord = $('#passWord').val();
	if (userName != "" && passWord != "")  {
		var obj = {userName:userName, passWord:passWord}
		login(obj);
	}
  });
  
  	/*$('#reg').bind("click",function(){
	console.log("23333");
	//$('#myEmail').show();
	$('#my_telephone').show();
	$('#myEmail').show();
	//var email=$('#email').val();
    var userName = $('#userName').val();
	var passWord = $('#passWord').val();
	
	if (userName != "" && passWord != "") {
		var obj={userName:userName, passWord:passWord};
	  	sendjson('register',obj, registerOk, loginError)
	}
  });
*/
	$('#regSure').bind('click',function(){
		console.log("register................");
		var userName=$('#regUserName').val();
		var passWord=$('#regPassWord').val();
		var email=$('#regEmail').val();
		var telephone=$('#regTelephone').val();
		if(userName != "" && passWord != "" && email != ""&& telephone != ""){
			var obj={userName:userName,passWord:passWord,email:email,telephone:telephone};
			sendjson('register',obj,registerOk,loginError);
		}
		else{
			alert("请填写完整");
		}
		
	})


  	$('#logout').tap(function(){
	   sendjson('logout', {}, logoutOk, loginError)
  });

  	$('#toUserInfo').tap(checkUserInfo);
  	
    $('#sureCreateGroup').tap(sureCreateGroup);

	$('#main').on("pagebeforeshow", mainPageLoad);
  	$('#userDetailInfo').on("pagebeforeshow",bulidUserInfoPage);
  	$('#groupInfoListPage').on("pagebeforeshow", buildGroupInfoList);
	$('#changePassWordSubmit').on('tap', changePassWord);
	$('#createMeeingSubmit').tap(createMeetingSubmit);
	//$('#sureCreateGroup').on('tap',sureCreateGroup);

	

  
});

function initgroupInfoOptionMenu(userGroupInfo){
	var state=NORMAL_MEMBER;
	if(typeof userGroupInfo!='undefined'){
		state=userGroupInfo.state;
	}
	if(state!=CREATER){
		console.log("hide");
		$('#getGroupAcceptInfo').hide();
		$('#toCreateMeetingPage').hide();
	}else{
		$('#getGroupAcceptInfo').show();
		$('#toCreateMeetingPage').show();
		$("#groupAcceptUserCount").text(groupInfo.applyUserNum);
	}

}






function bulidUserInfoPage(){
	var user=checkUserInfo();
	if(user!= null){
		$('#userNameInPage').text(user.userName);
		$('#telePhone').text(user.telephone);
		$('#email').text(user.email);
	}

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

function mainPageLoad(event, data) {
	console.log("main");
	if (typeof localStorage.user == 'undefined') {
		localStorage.user = "{}";
		$('#loginInfoLable').hide();
	}

	var user = JSON.parse(localStorage.user || '{}');
	
	if (user != null && typeof user.userName != 'undefined') {
		$('#logout').show();
       
		
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
		//moveToLoginPage();
		alert("登录成功");
		localStorage.user = JSON.stringify(obj.user);
		moveToIndex();
		$("#add").hide();
		$("#logout").show();
	} else {
		alert(obj.errMsg);
	}
}
function moveToIndex(){
	$.mobile.changePage("#main", {allowSamePageTransition : true, transition : "slideup"}); 
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
		var userName = $('#regUserName').val();
		var passWord = $('#regPassWord').val();
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

f
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




function clearLoginInfo() {
	// 清除本地登录信息
	localStorage.user = "{}";
	moveToLoginPage();
}
function moveToLoginPage(){
	$.mobile.changePage("#loginForm",{allowSamePageTransition : true, transition : "slideup"});
}

function moveToMainPage(){
	$.mobile.changePage("#main", {allowSamePageTransition : true, transition : "slideup"}); 
	// location.reload();
}

function sureCreateGroup(){
	var formData = $("#createGroupInfoForm").serialize(); 
	console.log(formData);
	alert(formData);
	sendjsonByText("createGroupInfo", formData, function(obj) {
		if (obj.ok == true) {
			alert("创建成功");
			moveToMainPage();
		} else {
			alert(obj.errMsg);
		}
	})
}
function buildGroupInfoList(event, data) {
	// checkUserInfo();
	console.log("buildGroupInfoList")
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
					var itemHtml = "<li><a  id = "+ groupItemId +">" + groupName + "</a></li>";
					$("#groupInfoList").append(itemHtml);
					var item = document.getElementById(groupItemId);
					item.setAttribute("itemid", i);
					// groupInfoPanelTitle = "<h3 id = \"groupInfoPanelTitle\">"+ groupName +"</h3>"
					$("#" + groupItemId).on("tap",function(){
						var index = this.getAttribute("itemid");
						var groupInfo = groupInfoList[index];
						var state = groupInfo.state;
						groupInfoSelected = groupInfo;
						$("#groupInfoListPage_groupInfoOptionMenuPanel").panel("open");
						if (state != CREATER) {
							console.log("hide");
							$("#getGroupAcceptInfo").hide();
							$("#toCreateMeetingPage").hide();
							
						} else {
							$("#getGroupAcceptInfo").show();
							$("#toCreateMeetingPage").show();
							$("#groupAcceptUserCount").text(groupInfo.applyUserNum);
						}
					});  


				}
			} else {
				$("#groupInfoList").append('<h4>' + obj.errMsg +'</h4>');
			}
			$('#groupInfoList').listview('refresh');  
	});

}
//--------------------------------------------会议模块--------------------------------------------------
function createMeetingSubmit(){
	var groupInfo=groupInfoSelected;
	initgroupInfoOptionMenu(groupInfo);
	var formData=$("#createMeetingInfoForm").serialize();
	console.log(formData);
	formData = formData + "&groupId=" +groupInfo._id;
	console.log(formData);
	sendjsonByText("createMeetingInfo",formData,function(obj){
		if(obj.ok==true){
			alert("创建成功");
			moveToMainPage();
		}else{
			alert(obj.errMsg);
		}
	})
}


function sendjson(urlsuffix,obj,win,fail) {
  console.log("sendjson  "+ urlsuffix);
  // common.loading();
  // common.stopLoading();
  $.ajax({
    url:SERVER_IP_ADDRESS+urlsuffix,
    type:'POST',
    contentType:'application/json',
    dataType:'json',
    data:JSON.stringify(obj),
    success:function(result){
	  console.log("win_1");
	  if (result.errcode == ERR_CODE_NOT_LOGIN) {
		  alert("您尚未登录");
		  clearLoginInfo();
	  } else {
		  win && win(result);
	  }
	  console.log("win");
	  // common.stopLoading();
    },
    failure:function(){
	  console.log("win_2");
      fail && fail();
	  console.log("fail");
	  // common.stopLoading();
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
	  if (result.errcode == ERR_CODE_NOT_LOGIN) {
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