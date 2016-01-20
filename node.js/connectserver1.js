var connect = require('connect');
var util    = require('util');
var fs   = require('fs');
var knox = require('knox');

var http    = require('http');
var router  = require('router');
var bodyParser  = require('body-parser');
//var session = require('cookie-session');
var session = require('express-session');
var cookieParser = require('cookie-parser');


var mongo = require('./mongo.js');
var common = require('./common.js');

var multer  = require('multer');


var LoginRouter1 = router();
var LoginRouter2 = router();
var GroupRouter = router();
var FileRouter = router();
var MeetingRouter = router();

// ---------------------------------------------------引入各模块业务处理层--------------------------------------------------------------------
var user = require('./user.js')
var group = require('./group.js');
var fileService = require('./file.js');
var meeting = require('./meeting.js');

// ---------------------------------------------------框架内实用方法--------------------------------------------------------------------

// 初始化mongo对象
function mongoInit() {
	user.init(mongo);
	group.init(mongo);
	fileService.init(mongo);
	meeting.init(mongo);
}

function sendjson(res,obj){
  res.writeHead(200,{
    'Content-Type': 'text/jsonp',
  });
  var objstr = JSON.stringify(obj);
  util.debug('SENDJSON:'+objstr);
  res.end( objstr );
}

function checkUserInSession(req, res, next) {
	if (typeof req.session.user == 'undefined') {
		// 没有登录
		JsonObj = {ok:false, errcode:common.ERR_CODE_NOT_LOGIN};
		JsonObj.errMsg = "尚未登录";
		sendjson(res, JsonObj);
	} else {
		resetSessionMaxAge(req);
		next();
	}
}

function resetSessionMaxAge(req) {
	// 重置session有效时间
	req.session['resetCookieTime'] = +new Date;
	// var maxAge = 60000;
	// req.session.cookie.expires = new Date(Date.now() + maxAge);
	// req.session.cookie.maxAge = maxAge;	
}

// ---------------------------------------------------用户模块action--------------------------------------------------------------------

// 用户登录action
function login(req,res){
	console.log("---------------");
	console.log("actin:login");
	user.login(req.body.userName,req.body.passWord,function(jsonObj){
		if(jsonObj.ok==true){
			req.session.user=jsonObj.user;
		}
		sendjson(res,jsonObj);
	});
}

// 用户注册action
function register(req, res) {
	console.log("--------------------------");
	console.log("action : register");
	user.register(req.body.userName, req.body.passWord,req.body.email,req.telephone,function(jsonObj) {
		sendjson(res,jsonObj);
	});
}
// 用户重连接action
function reconnect(req, res) {
	console.log("--------------------------");
	console.log("action : reconnect");
	var  JsonObj = {};
	if (typeof req.session.user == 'undefined') {
		JsonObj.ok = false;
	} else {
		JsonObj.ok = true;
		JsonObj.user = req.session.user;
	}
	sendjson(res,JsonObj);	
}
// 用户登出action
function logout(req, res) {
	console.log("--------------------------");
	console.log("action : logout");
	// 清除session信息
	JsonObj = {ok:true};
	req.session.destroy(function(err) {
		// cannot access session here
		JsonObj = {ok:false};
		JsonObj.errMsg = err;
	});
	sendjson(res,JsonObj);
}
// 用户更改密码action
function changePassWord(req, res) {
	console.log("--------------------------");
	console.log("action : changePassWord");
	var JsonObj = {};
	var userName = req.session.user.userName;
	var newPassWord = req.body.newPassWord;
	var oldPassWord = req.body.oldPassWord;
	user.changePassWord(userName, newPassWord, oldPassWord, function(jsonObj) {
		sendjson(res,jsonObj);
	});

}

// ---------------------------------------------------组织模块action--------------------------------------------------------------------

// 获取组织信息action
function getGroupInfo(req, res) {
	console.log("--------------------------");
	console.log("action : getGroupInfo");
	var userName = req.session.user.userName;
	group.getGroupInfo(userName, function(jsonObj) {
		sendjson(res,jsonObj);
	});
	
}

// 创建组织action
function createGroupInfo(req, res) {
	console.log("--------------------------");
	console.log("action : createGroupInfo");
	console.log(req.body);

	var userName = req.session.user.userName;
	if (typeof req.body.groupName == 'undefined') {
		var errMsg = "请输入组织名称";
		JsonObj = {ok:false, errMsg:errMsg};
		sendjson(res,JsonObj);
	} else {
		group.createGroupInfo(userName, req.body, function(jsonObj) {
			sendjson(res,jsonObj);
		});
	}
}

// 搜索组织action
function searchGroupInfo(req, res) {
	console.log("--------------------------");
	console.log("action : searchGroupInfo");
	var userName = req.session.user.userName;
	var groupStr = req.body.groupStr;
	if (typeof req.body.groupStr == 'undefined' || groupStr == "") {
		var errMsg = "请输入欲查询的名称";
		JsonObj = {ok:false, errMsg:errMsg};
	} else {
		group.searchGroupInfo(userName, groupStr, function(jsonObj) {
			sendjson(res,jsonObj);
		});
	}
}

// 申请加入组织action
function applyForGroup(req, res) {
	console.log("--------------------------");
	console.log("action : applyForGroup");
	var userName = req.session.user.userName;
	var groupId = req.body.groupId;
	group.applyForGroup(userName, groupId, function(jsonObj) {
			sendjson(res,jsonObj);
	});
}

// 同意用户加入组织action
function acceptApply(req, res) {
	console.log("--------------------------");
	console.log("action : acceptApply");
	var userName = req.session.user.userName;
	var applierName = req.body.applierName;
	var groupId = req.body.groupId;
	group.acceptApply(userName, applierName, groupId, function(jsonObj) {
			sendjson(res,jsonObj);
	});
}

// 获取申请加入组织的用户列表action
function getApplyUserList(req, res) {
	console.log("--------------------------");
	console.log("action : getApplyUserList");
	var userName = req.session.user.userName;
	var groupId = req.body.groupId;
	group.getApplyUserList(groupId, function(jsonObj) {
			sendjson(res,jsonObj);
	});
}



// ---------------------------------------------------构建服务器框架--------------------------------------------------------------------
var app = connect()// 创建新的connect对象
  .use(bodyParser.urlencoded({extended:false}))// 参数解析组件（常规传参）
  .use(bodyParser.json({ type: 'application/json' }))// 参数解析组件（以json对象形式传参）
  .use(multer({ dest: common.uploadPath})) // 上传文件解析组件
  .use(cookieParser()) // cookie解析组件
  .use(session({ // session组件
	secret: 'keyboard cat',// session key
	resave: false,
	saveUninitialized: true,
	cookie : {maxAge : 30*60*1000} // session有效时间
}))
  .use(LoginRouter1.post('/login',login).post('/register',register).post('/reconnect',reconnect)) // 路由组件
  .use(checkUserInSession) // 验证用户登录状态
  .use(LoginRouter2.post('/logout',logout).post('/changePassWord', changePassWord)) //用户模块路由
  .use(GroupRouter.post('/getGroupInfo', getGroupInfo).post('/createGroupInfo', createGroupInfo)
  .post('/searchGroupInfo', searchGroupInfo)
  .post('/acceptApply', acceptApply).post('/getApplyUserList', getApplyUserList)) //组织管理模块路由

var server = http.createServer(app);// 创建服务器实例

mongo.init('test','127.0.0.1');// 初始化mongo连接对象
mongo.open();
mongoInit();
server.listen(3006); // 开始监听3006端口的服务器请求
util.debug('Server running at http://127.0.0.1:3003');// 服务器初始化完成打印日志