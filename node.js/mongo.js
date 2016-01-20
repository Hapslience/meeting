
var util    = require('util');

// USE npm mongo
var mongodb = require('mongodb');

var mongo = mongodb;
var db = null;

var name   = "test";
var server = "localhost";
// var port   = mongodb.Connection.DEFAULT_PORT;
var default_port = 27017;

exports.ObjectId = mongodb.ObjectID;

// 根据IP地址，端口和数据库名称初始化数据库连接
exports.init = function( name, server, port ) {
  port = port || default_port;
  util.log('mongo:name='+name+',server='+server+',port='+port);
  // 新建数据库服务器对象
  db = new mongodb.Db(
      name, 
      new mongodb.Server(server, port, {auto_reconnect:true}), 
      {native_parser:true});
}

// 处理mongo请求发生错误的通用方法
function res(win, fail) {
	return function(err,res) {
    if( err ) {
      util.log('mongo:err:'+JSON.stringify(err));
      fail && 'function' == typeof(fail) && fail(err);
    }
    else {
      win && 'function' == typeof(win) && win(res);
    }
  }
}

// 打开数据库连接
exports.open = function(win,fail){
	// 打开数据库
    db.open(function(err,db){
      if(!err){
        console.log("open"+db.name);
      }
    })
}

exports.coll = function(name,win,fail){
   db.collection(name,res(win,fail));
}

exports.find = function(cursor, callback) {
	var result = [];
	cursor.each(res(function(item) {
		if (item) {
			// var groupId = ObjectID(item._id);
			// groupIdList.push(groupId);
			result.push(item);
		} else {
			callback(result);
		}
	}));
}

exports.findOne = function(cursor, callback) {
	var result = null;
	this.find(cursor, function(res) {
		if (res.length >= 1) {
			result = res[0];
		} 
		callback(result);
	})
}

exports.res = res;






// var db = 
  // new mongodb.Db(
    // name, 
    // new mongodb.Server(server, port, {}), 
    // {native_parser:true,auto_reconnect:true}
  // );
// util.debug('mongo:name='+name+',server='+server+',port='+port);

// function res(win) {
  // return function(err,result){
    // if( err ) {
      // util.debug('mongo:err='+err);
      // db.close();
    // }
    // else {
      // win(result);
    // }
  // }
// }

// db.open(res(function(){
  // util.debug('mongo:ok');

  // db.collection('fruit',res(function(fruit){
    // util.debug('mongo:fruit:ok');

    // fruit.insert(
      // {name:'apple',price:0.99},
      // res(function(apple){
        // util.debug('mongo:insert:'+
                   // JSON.stringify(apple));

        // fruit.update(
          // {name:'apple'},
          // {$set:{price:1.99}},
          // res(function(){
            // util.debug('mongo:update');

            // fruit.find(
              // {name:'apple'},
              // res(function(cursor){
                // util.debug('mongo:cursor');

                // cursor.each(
                  // res(function(item){
                    // if( item ) {
                      // util.debug('mongo:item:'+
                                 // JSON.stringify(item));
                    // }
                    // else {
                      // db.close();
                    // }
                  // })
                // )
              // })
            // )
          // })
        // )
      // })
    // )
  // }))
// }));

