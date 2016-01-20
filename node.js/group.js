var mongo = require('./mongo.js');// mongo连接对象
var common = require('./common.js');
var util    = require('util');
// var ObjectID = require('mongodb').ObjectID;
var ObjectID = require("bson").ObjectID;


// 申请加入组织状态
var CREATER = 1;
var NORMAL_MEMBER = 2;
var TO_BE_ACCEPTED = 0;

exports.init = function(mongo) {
	this.mongo = mongo;
};

// 获取某用户所有组织信息
exports.getGroupInfo = function(userName, callback) {
	var JsonObj = {};
	var userGroupArr = [];
	var userGroupIdList = [];
	var userGroupList = [];
	mongo.coll('user_group', function(user_group) {
		var query = {userName : userName, state : {$ne:TO_BE_ACCEPTED}};
		user_group.find(query, mongo.res(function(cursor) {
			var isFind = false;
			cursor.each(mongo.res(function(item) {
				if (item) {
					item.groupId = item.groupId.toString();
					// userGroupIdList.push(item.groupId);
					userGroupList.push(item);
					isFind = true;
				} else {
					if (isFind) {
						mongo.coll('group_info', function(group) {
							for (var i in userGroupList) {
								var groupId = userGroupList[i].groupId;
								getApplyUserList(groupId, function (result) {
									var groupId = result.groupId;
									var groupQuery = {_id : ObjectID(groupId)};
									group.find(groupQuery, mongo.res(function(cursor) {
										cursor.each(mongo.res(function(item) {
											if (item) {
												var resultGroupItem = item;
												item.state = userGroupList[i].state;
												if (result.ok) {
													item.applyUserNum = result.applyUserList.length;
												} else {
													item.applyUserNum = 0;
												}
												userGroupArr.push(item);
											} else {
												if (userGroupArr.length == userGroupList.length) {
													JsonObj.ok = true;
													userGroupArr.sort(function(userGroup_1,userGroup_2){
														return common.sortByLetter(userGroup_1.name, userGroup_2.name);
													})
													JsonObj.userGroupList = userGroupArr;
													callback(JsonObj);
												}
											}			
										}));
									}));
								})
								
							}
						});
					} else {
						JsonObj.ok = false;
						JsonObj.errMsg = "抱歉，你还没有加入任何组织";
						callback(JsonObj);
					}

				}				
			}));
		}));
	});
}

// 创建一个组织信息
exports.createGroupInfo = function(userName, newGroupInfo, callback) {
	var JsonObj = {};
	var groupInfo = {};
	var newGroupName = newGroupInfo.groupName;
	groupInfo.name = newGroupName;
	groupInfo.creatUser = userName;
	groupInfo.createDate = common.dateNow();
	if (newGroupInfo.maxSize) {
		groupInfo.maxSize = newGroupInfo.maxSize;
	}
	if (newGroupInfo.type) {
		groupInfo.type = newGroupInfo.type;
	}
	mongo.coll('group_info', function(group) {
		var query = {name : newGroupName};
		// 先查找是否有重名组织，若有重名，返回错误
		group.find(query, mongo.res(function(cursor) {
			var isFindSameGroup = false;
			cursor.each(mongo.res(function(item) {
				if (item) {
					// 有同名的组织
					isFindSameGroup = true;
					JsonObj.ok = false;
					JsonObj.errMsg = "对不起，已有相同的组织存在"
				} else {
					if (!isFindSameGroup) {
						// 没有同名组织，进入创建逻辑
						group.insert(groupInfo,  mongo.res(function(result) {
							console.log(result.ops[0]);
							var groupInfo = result.ops[0];
							var userGroup = {};
							userGroup.userName = userName;
							userGroup.groupId = ObjectID(groupInfo._id.toString());
							userGroup.state = CREATER;
							mongo.coll('user_group', function(user_group) {
									user_group.insert(userGroup, mongo.res(function(userGroup) {
										JsonObj.ok = true;
										callback(JsonObj);
								}));
							});
						}));
					} else {
						callback(JsonObj);
					}
				}
			}))
		}))

		
	});
} 

// 根据查找关键字搜索组织信息
exports.searchGroupInfo = function(userName, groupStr, callback) {
	var JsonObj = {};
	var groupInfoList = [];
	var groupIdList = [];
	var userGroupList = [];
	var resultGroupInfoList = [];
	var isFind = false;
	mongo.coll("group_info", function(group_info) {
		var query = {name : {$regex:groupStr}};
		group_info.find(query, mongo.res(function(cursor) {
			// 首先获取所有符合搜索条件的组织
			cursor.each(mongo.res(function(item) {
				if (item) {
					// var groupId = ObjectID(item._id);
					// groupIdList.push(groupId);
					groupInfoList.push(item);
				} else {
					// console.log("groupIdList");
					// console.log(groupIdList);
					// 再剔除用户已经所属的组织
					mongo.coll('user_group', function(user_group) {
						var query = {userName : userName};
						user_group.find(query, mongo.res(function(cursor) {
							cursor.each(mongo.res(function(item) {
								if (item) {
									userGroupList.push(item);
								} else {
									console.log("userGroupList");
									console.log(userGroupList);
									console.log("groupInfoList");
									console.log(groupInfoList);
									for (var i in groupInfoList) {
										var groupInfo = groupInfoList[i];
										var groupId = groupInfo._id;
										var isExist = false;
										for (var j in userGroupList) {
											var userGroup = userGroupList[j];
											console.log(i+" "+j);
											console.log(groupId.toString());
											console.log(userGroup.groupId.toString());
											if (groupId.toString() == userGroup.groupId.toString()) {
												console.log("true");
												isExist = true;
											}
										}
										if (!isExist) {
											resultGroupInfoList.push(groupInfo);
											isFind = true;
										}
									}
									if (isFind) {
										JsonObj.ok = true;
										JsonObj.groupInfoList = resultGroupInfoList;
									} else {
										JsonObj.ok = false;
										JsonObj.errMsg = "抱歉，没有找到相关组织信息";
									}
									callback(JsonObj);
								}
							}))
						}))
					})
				}				
			}))
		}))
	})
}

// 根据组Id申请加入组织
exports.applyForGroup = function(userName, groupId, callback) {
	var JsonObj = {};
	var userGroup = {};
	var isFind = false;
	var isReturn = false;
	console.log("groupId");
	console.log(groupId);
	groupId = groupId.toString();
	console.log(groupId);
	// groupId = "55485e682502d938867e4c35";
	mongo.coll('group_info', function(group_info) {
		var groupQuery = {_id : ObjectID(groupId)};
		group_info.find(groupQuery, mongo.res(function (cursor) {
			cursor.each(mongo.res(function(item) {
				if (item) {
					isFind = true;
					console.log("isFind  true");
					userGroup.userName = userName;
					userGroup.groupId = ObjectID(groupId.toString());
					userGroup.state = TO_BE_ACCEPTED;
				} else {
					if (!isReturn) {
						if (isFind) {
							mongo.coll('user_group', function(user_group) {
								user_group.insert(userGroup, mongo.res(function(){
									JsonObj.ok = true;
									callback(JsonObj);
								}))
							})	
						} else {
							console.log("fail");
							JsonObj.ok = false;
							JsonObj.errMsg = "抱歉，没有找到相关组织信息";
							isReturn = true;
							callback(JsonObj);
						}
					}
				}
			}))
		}))
	})
}

// 同意申请
exports.acceptApply = function(userName, applierName, groupId, callback) {
	var JsonObj = {};
	var isReturn = false;
	// console.log(isFind);
	console.log(userName);
	console.log(applierName);
	console.log(groupId);
	mongo.coll('user_group', function(user_group) {
		// 检验用户审批资格
		var query = {userName : userName, groupId : ObjectID(groupId.toString())};
		user_group.find(query, mongo.res(function(cursor) {
			var isFindUser = false;
			mongo.findOne(cursor, function(item) {
				if (item == null) {
					JsonObj.ok = false;
					JsonObj.errMsg = "你尚未加入该组织";
					callback(JsonObj);
				} else {
					var state = item.state;
					if (state != CREATER) {
						JsonObj.ok = false;
						JsonObj.errMsg = "你没有审批资格";
						callback(JsonObj);
					} else {
						// 检验完审批者资格，开始检验被审批者资格
						var applierQuery = {userName : applierName, groupId : ObjectID(groupId)};
						user_group.find(applierQuery, mongo.res(function(cursor) {
							mongo.findOne(cursor, function(item) {
								if (item == null) {
									// -.-
									JsonObj.ok = false;
									JsonObj.errMsg = "该用户还没有申请加入该组织";
									callback(JsonObj);
								} else {
									var state = item.state;
									if (state != TO_BE_ACCEPTED) {
										console.log("3");
										JsonObj.ok = false;
										JsonObj.errMsg = "该用户已经加入该社团";
										callback(JsonObj);
									} else {
										// 所有前置检查已做完，完成更新操作
										user_group.update(item, {$set:{state:NORMAL_MEMBER}}, function() {
											console.log("4");
											JsonObj.ok = true;
											callback(JsonObj);
										});
									}
								}
							});
						}));
					} 
				}
			})
		}));
	});
}

exports.getGroupUserList = function(groupId, callback) {
	var JsonObj = {};
	var userList = [];
	var groupObjectId = ObjectID(groupId.toString());
	console.log(groupObjectId);
	mongo.coll('user_group',  function(user_group) {
		var query = {groupId : groupObjectId, state : {$ne:TO_BE_ACCEPTED}}; 
		user_group.find(query, mongo.res(function(cursor){
			mongo.find(cursor, function(result){
				if (result.length > 0) {
					for (var i in result) {
						var userInfo = result[i];
						var userNamePy = common.ConvertPinyin(userInfo.userName);
						userInfo.userNameFirstLetter = userNamePy.slice(0,1).toUpperCase();
						userList.push(userInfo);
					}
					userList.sort(function(userInfo_1, userInfo_2) {
						return common.sortByLetter(userInfo_1.userNameFirstLetter, userInfo_2.userNameFirstLetter);
					})
					JsonObj.ok = true;
					JsonObj.userList = userList;
					callback(JsonObj);
				} else {
					JsonObj.ok = false;
					JsonObj.errMsg = "抱歉,目前该组织没有任何人";
					callback(JsonObj);
				}
			})
		}))
	})
}


function getApplyUserList(groupId, callback) {
	var JsonObj = {};
	var applyUserList = [];
	
	var isReturn = false;
	mongo.coll('user_group', function(user_group) {
		var query = {groupId : ObjectID(groupId), state : TO_BE_ACCEPTED}; 
		user_group.find(query, mongo.res(function(cursor) {
			var isFind = false;
			cursor.each(mongo.res(function(item) {
				if (item) {
					isFind = true;
					applyUserList.push(item.userName);
				} else {
					if (isFind) {
						JsonObj.ok = true;
						JsonObj.applyUserList = applyUserList;
						JsonObj.groupId = groupId;
					} else {
						JsonObj.groupId = groupId;
						JsonObj.ok = false;
						JsonObj.errMsg = "抱歉,目前没有人申请加入该组织";
					}
					callback(JsonObj);
				}
			}))
		}))
	});
}

exports.getApplyUserList = getApplyUserList;