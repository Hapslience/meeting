var mongo = require('./mongo.js');// mongo连接对象
var common = require('./common.js');
var util    = require('util');
// var ObjectID = require('mongodb').ObjectID;
var ObjectID = require("bson").ObjectID;
var group = require('./group.js');
var moment = require('moment')


var schedule = {};
// schedule.title = "开幕式";
// schedule.content = "这是第一个日程简介哦";
// schedule.day = "2015-6-3" ;//moment("2015-6-3", "YYYY-MM-DD");
// schedule.startTime = "20:30" ;//moment("20:30", "HH:mm");
// schedule.endTime = "21:30" ;//moment("21:30", "HH:mm");
// schedule.roomAddr = "303";
exports.init = function(mongo) {
	this.mongo = mongo;
};

// 获取某用户所有组织信息
exports.createMeetingInfo = function(userName, newMeetingInfo, callback) {
	var JsonObj = {};
	var meetingInfo = {};
	
	var newMeetingName = newMeetingInfo.meetingName;
	var startDate = newMeetingInfo.meetingStartDate;
	var endDate = newMeetingInfo.meetingEndDate;
	var addr = newMeetingInfo.meetingAddr;
	var groupId = newMeetingInfo.groupId;
	
	meetingInfo.name = newMeetingName;
	meetingInfo.creatUser = userName;
	meetingInfo.startDate = startDate;
	meetingInfo.endDate = endDate;
	meetingInfo.addr = addr;
	meetingInfo.groupId = ObjectID(groupId);
	console.log(common.getDateDiff(startDate, endDate));
	// 检验参数合法性
	if (common.getDateDiff(startDate, endDate) < 0) {
		// 检验用户输入时间的合法性
		JsonObj.ok = false;
		JsonObj.errMsg = "您输入的结束时间早于开始时间有误，请重新输入";
		callback(JsonObj);
	} else if (addr == "") {
		// 检验用户是否输入了地址
		JsonObj.ok = false;
		JsonObj.errMsg = "您输入的结束时间早于开始时间有误，请重新输入";
		callback(JsonObj);		
	} else {
		mongo.coll('meeting', function(meeting) {
		var query = {name : newMeetingName};
		// 先查找是否有重名组织，若有重名，返回错误
			meeting.find(query, mongo.res(function(cursor) {
				mongo.findOne(cursor, function(item) {
					if (item != null) {
						// 有重名
						JsonObj.ok = false;
						JsonObj.errMsg = "对不起，已有相同的组织存在";
						callback(JsonObj);
					} else {
						// 没有重名，进入正常插入逻辑
						meeting.insert(meetingInfo,  mongo.res(function(result) {
							JsonObj.ok = true;
							callback(JsonObj);
						}));
					}
				});
			}));
		});
	}
}

exports.getMeetingList = function(userName, callback) {
	var JsonObj = {};
	var meetingList = [];
	// group.init(mongo);
	group.getGroupInfo(userName, function(resObj) {
		// 首先获取玩家的组织信息
		if (resObj.ok == true) {
			// 正确获取组织信息
			var userGroupList = resObj.userGroupList;
			if (userGroupList.length < 1) {
				JsonObj.ok = false;
				JsonObj.errMsg = "您还没有加入任何组织";
				callback(JsonObj);
			} else {
				mongo.coll("meeting", function(meeting) {
					var count = 0;
					for (var i in userGroupList) {
						var userGroup = userGroupList[i];
						var groupId = ObjectID(userGroup._id.toString());
						// var groupId = ObjectID("5556bb5a6ed53154161ae3be");
						var query = {groupId : groupId};
						// var query = {name : "sdf"};
						meeting.find(query, mongo.res(function(cursor) {
							mongo.find(cursor, function(res) {
								if (res.length > 0) {
									for (var j in res) {
										var meetingInfo = res[j];
										meetingInfo.groupName = userGroup.name;
										meetingList.push(meetingInfo);
									}
								}
								count = count + 1;
								if (count == userGroupList.length) {
									if (meetingList.length == 0) {
										JsonObj.ok = false;
										JsonObj.errMsg = "对不起，您目前尚未参加任何会议";
										callback(JsonObj);
									} else {
										meetingList.sort(function(meeting_a,meeting_b) {
											var startDate_a = meeting_a.startDate;
											var startDate_b = meeting_b.startDate;
											var moment_a = moment(startDate_a, "YYYY-MM-DD");
											var moment_b = moment(startDate_b, "YYYY-MM-DD");
											if (moment_a != moment_b) {
												return momentCompare(moment_a, moment_b);
											} else {
												return common.sortByLetter(meeting_a.name, meeting_b.name)
											}
											
										})
										JsonObj.ok = true;
										JsonObj.meetingList = meetingList;
										callback(JsonObj);
									}
									
								}
							})
						}))
					}
				})
			}
		} else {
			callback(resObj);
		}
	})
}

exports.getManagedMeetingList = function(userName, callback) {
	var JsonObj = {};
	var meetingList = [];
	mongo.coll('meeting', function(meeting) {
		var query = {creatUser : userName};
		meeting.find(query, mongo.res(function(cursor) {
			mongo.find(cursor, function(result){
				if (result.length == 0) {
					JsonObj.ok = false;
					JsonObj.errMsg = "额,您好像没有对任何会议的管理权利吖";
					callback(JsonObj);
				} else {
					JsonObj.ok = true;
					JsonObj.meetingList = result;
					callback(JsonObj);
				}
			})
		}));
	});
}

exports.getMeetingSchedule = function(meetingId, callback) {
	var meetingObjectId = ObjectID(meetingId.toString());
	mongo.coll('meeting', function(meeting) {
		var query = {_id : meetingObjectId};
		meeting.find(query, mongo.res(function(cursor) {
			mongo.findOne(cursor, function(item) {
				if (item != null) {
					var scheduleList = item.scheduleList;
					if (typeof scheduleList == "undefined") {
						scheduleList = [];
					} else {
						scheduleList = item.scheduleList;
					}
					JsonObj.ok = true;
					JsonObj.scheduleList = scheduleList;
					callback(JsonObj);
				} else {
					JsonObj.ok = false;
					JsonObj.errMsg = "额,好像没有这个会议吖";
					callback(JsonObj);
				}
			});
		}));
	});
	
}

exports.createMeetingSchedule = function(meetingId, scheduleInfo, callback) {
	var meetingObjectId = ObjectID(meetingId.toString());
	var newScheduleInfo = {};
	var JsonObj = {};
	newScheduleInfo.title = scheduleInfo.scheduleTitle;
	newScheduleInfo.content = scheduleInfo.scheduleContent;
	newScheduleInfo.detailContent = scheduleInfo.scheduleDetailContent;
	newScheduleInfo.speaker = scheduleInfo.speakerSelect;
	newScheduleInfo.day = scheduleInfo.scheduleDay;
	newScheduleInfo.startTime = scheduleInfo.scheduleStartTime;
	newScheduleInfo.endTime = scheduleInfo.scheduleEndTime;
	newScheduleInfo.roomAddr = scheduleInfo.scheduleRoomAddr;
	mongo.coll('meeting', function(meeting) {
		var query = {_id : meetingObjectId};
		meeting.find(query, mongo.res(function(cursor){
			mongo.findOne(cursor, function(item) {
				if (item != null) {
					var startDate = item.startDate;
					var endDate = item.endDate;
					var date = moment(newScheduleInfo.day, "YYYY-MM-DD");
					if (date.isAfter(endDate) || date.isBefore(startDate)) {
						JsonObj.ok = false;
						JsonObj.errMsg = "您输入的日期不正确";
						callback(JsonObj);
					} else {
						var scheduleList = item.scheduleList;
						if (typeof scheduleList == "undefined") {
							scheduleList = [];
						} else {
							scheduleList = item.scheduleList;
						}
						scheduleList.push(newScheduleInfo);
						if (scheduleList.length > 1) {
							scheduleList.sort(scheduleCompare);
						}
						console.log(scheduleList);
						meeting.update(query, {$set:{scheduleList:scheduleList}}, mongo.res(function (result) {
							console.log(result);
							JsonObj.ok = true;
							callback(JsonObj);
						}))
					}
				} else {
					JsonObj.ok = false;
					JsonObj.errMsg = "额,好像没有这个会议吖";
					callback(JsonObj);
				}
			});
			
		}));
	});
}

function insertSchedule(meetingId, callback) {
		var meetingObjectId = ObjectID(meetingId.toString());
		mongo.coll('meeting', function(meeting) {
		var query = {_id : meetingObjectId};
			meeting.find(query, mongo.res(function(cursor) {
				mongo.findOne(cursor, function(item) {
					if (item != null) {
						var scheduleList = item.scheduleList;
						if (typeof scheduleList == "undefined") {
							scheduleList = [];
						} else {
							scheduleList = item.scheduleList;
						}
						scheduleList.push(schedule);
						meeting.update(item, {$set:{scheduleList:scheduleList}}, mongo.res(function () {
							callback();
						}))
					}
				});
			}));
		});
}

exports.getMeetingAttenderList = function(meetingId, callback){
	var JsonObj = {};
	var meetingObjectId = ObjectID(meetingId.toString());
	mongo.coll('meeting', function(meeting){
		var query = {_id : meetingObjectId};
		meeting.find(query, mongo.res(function(cursor){
			mongo.findOne(cursor, function(result){
				if (result != null) {
					group.getGroupUserList(result.groupId, function(JsonObjResult){
						if (JsonObjResult.ok == true) {
							callback(JsonObjResult);
						} else {
							JsonObj.ok = false;
							JsonObj.errMsg = "额，该会议没有与会者？";
							callback(JsonObj);
						}
					})
				} else {
					JsonObj.ok = false;
					JsonObj.errMsg = "额,好像没有这个会议吖";
					callback(JsonObj);
				}
			})
		}))
	})
}

exports.createMeetingNote = function(meetingId, noteInfo, callback) {
	var meetingObjectId = ObjectID(meetingId.toString());
	var newNoteInfo = {};
	var JsonObj = {};
	newNoteInfo.title = noteInfo.noteTitle;
	newNoteInfo.content = noteInfo.noteDetailContent;
	newNoteInfo.createDate = common.dateNow();
	mongo.coll('meeting', function(meeting) {
		var query = {_id : meetingObjectId};
		meeting.find(query, mongo.res(function(cursor){
			mongo.findOne(cursor, function(item) {
				if (item != null) {
					var noteList = item.noteList;
					if (typeof noteList == "undefined") {
						noteList = [];
					} else {
						noteList = item.noteList;
					}
					noteList.push(newNoteInfo);
					meeting.update(query, {$set:{noteList:noteList}}, mongo.res(function (result) {
						console.log(result);
						JsonObj.ok = true;
						callback(JsonObj);
					}))
				} else {
					JsonObj.ok = false;
					JsonObj.errMsg = "额,好像没有这个会议吖";
					callback(JsonObj);
				}
			});
			
		}));
	});
}

exports.closeMeeting = function(meetingId, callback) {
	var meetingObjectId = ObjectID(meetingId.toString());
	var JsonObj = {};
	mongo.coll('meeting', function(meeting) {
		var query = {_id : meetingObjectId};
		meeting.remove(query, mongo.res(function(){
			JsonObj.ok = true;
			callback(JsonObj);
			
		}));
	});
}

function scheduleCompare(schedule_a,schedule_b) {
	if (schedule_a.day != schedule_b.day) {
		var moment_a = moment(schedule_a.day, "YYYY-MM-DD");
		var moment_b = moment(schedule_b.day, "YYYY-MM-DD");
		return momentCompare(moment_a, moment_b);
	} else {
		var moment_a = moment(schedule_a.startTime, "hh:mm");
		var moment_b = moment(schedule_b.startTime, "hh:mm");
		return momentCompare(moment_a, moment_b);
	}
}

function momentCompare(moment_a, moment_b) {
	if (moment_a.isAfter(moment_b)) {
			return 1;
	} else {
			return -1;
	}
}

