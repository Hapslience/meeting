
var util    = require('util');

// USE npm mongo
var mongodb = require('mongodb');

var mongo = mongodb;


var name   = "test";
var host="localhost";
//var port=mongodb.Connection.DEFAULT_PORT;
var port=27017
var server = new mongodb.Server(host,port,{auto_reconnect:true});
//exports.ObjectId = mongodb.ObjectID;

var db = new mongodb.Db("test",server,{safe:true});
// 根据IP地址，端口和数据库名称初始化数据库连接
/*db.open(function(err,db){
    if(err)
      throw err;
    else{
        db.collection("user",function(err,collection){
        collection.insert({username:"panpan",firstname:"li"},function(err,docs){
          console.log(docs);
          db.close();
        });
      });
    }
  });
*/
db.open(function(err,db){
  if(!err){
    db.collection("user",{safe:true},function(err,collection){
      var temp1={title:"hello",number:1};
      collection.insert(temp1,{safe:true},function(err,result){
       // console.log(result);
        db.close();
      })
    })
  }else{console.log(err);}
});
//错误
db.open(function(err,db){
     if(!err)  
        {   db.collection("user",{safe:true},function(err,collection){
         
           
            var tmp1 = {title:'hello'}; 
            var tmp2 = {title:'world'};
            collection.insert([tmp1,tmp2],{safe:true},function(err,result){
                  console.log(result);
                          }); 
           collection.find().toArray(function(err,docs){               
                          console.log('find'); 

                            console.log(docs); 
                        });  
            collection.findOne(function(err,doc){ 
              console.log('findOne'); 
              console.log(doc); 
                              });
                      });  
         }
         else
          console.log(err);
       
     })
 /* 
//插入
*/
/*
//删除 collection
db.open(function(err,db){
  if(!err){
    db.dropCollection("user",{safe:true},function(err,result){
      console.log(result);

    });
  }
})*/
//更新
/*
db.open(function(err,db){
  if(!err){
    db.collection("user",{safe:true},function(err,collection){
      collection.update({title:"hello"},{$set:{number:3}}.{safe:true},
        function(err,result){
          console.log(result);
        })
    })
  }
  else{
    console.log(err);
  }
});
//删除
db.open(function(err,db){
  if(!err){
    db.collection("user",{safe:true},function(err,collection){
      collection.remove({title:"hello"},{safe:true},function(err,result){
        console.log(result);
      });
    })
  }else
  console.log(err);  
})；
db.open(function(err,db){
  if(!err){
    db.collection("user",{safe:true},function(err,collection){

    })
  }
})*/










