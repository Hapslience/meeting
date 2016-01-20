var mongo = require('./mongo.js');// mongo连接对象
var common = require('./common.js');
var util    = require('util');
var multer  = require('multer');
var fs   = require('fs');
var knox = require('knox');
// var ObjectID = require('mongodb').ObjectID;
var ObjectID = require("bson").ObjectID;



exports.init = function(mongo) {
	this.mongo = mongo;
};

exports.uploadFile = function(userName, file, callback) {
	// Amazon S3上传操作对象
	var s3client = knox.createClient({
		key:    common.keyid,// S3指定的密钥Id
		secret: common.secret,// S3指定的密钥值
		bucket: common.bucketname,// 上传到的S3的目标桶名称
	})
	var JsonObj = {};
	// 文件在服务器中的缓存路径
	var upLoadFile = file.path
	var originalFileName = file.originalname;
	// 在上传文件前获取文件的必要参数（如文件大小）
	fs.stat(upLoadFile, function(err, stat){
	if (err) throw err;
	  console.log(stat);
	  var filesize = stat.size
	  // 获取文件读入流
	  var instream = fs.createReadStream(upLoadFile)

	  // 向S3上传文件流
	  var s3req = s3client.put(
		originalFileName,
		{
		  'Content-Length':filesize,
		  'x-amz-acl': 'public-read'
		}
	  )

	  instream.on('data',function(chunk){
		console.log('sending: '+chunk.length)
		s3req.write(chunk)
	  })

	  instream.on('end',function(){
		s3req.end()
		console.log('waiting for amazon...')
	  })

	  
	  s3req.on('error',function(err){
		console.log('error: '+err)
		JsonObj.ok = true;
		JsonObj.errMsg = err;
		callback(JsonObj);
	  })

	  s3req.on('response',function(s3res){
		console.log('response: '+s3res.statusCode);
		console.log(s3req.url);
		fs.unlink(upLoadFile);
		JsonObj.ok = true;
		// 上传完成，向数据库写入必要信息
		mongo.coll('user_file', function(user_file) {
			var userFile = {};
			userFile.userName = userName;
			userFile.fileName = originalFileName;
			userFile.url = s3req.url;
			user_file.insert(userFile, mongo.res(function(result) {
				// 向客户端返回上传成功
				callback(JsonObj);
			}));
		});
	  })
	})
}

exports.getUserFileList = function(userName, callback) {
	var JsonObj = {};
	var fileInfoList = [];
	mongo.coll("user_file", function(user_file) {
		var query = {userName : userName};
		user_file.find(query, mongo.res(function(cursor) {
			cursor.each(mongo.res(function(item) {
				if (item) {
					var fileInfo = {};
					fileInfo.fileName = item.fileName;
					fileInfo.url = item.url;
					fileInfoList.push(fileInfo);
				} else {
					JsonObj.ok = true;
					JsonObj.fileInfoList = fileInfoList;
					callback(JsonObj);
				}
				
			}));
		}))
	})
}

