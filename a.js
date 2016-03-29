var JSpider = require('./promiseSpider.js');
var Q  = require('q');
var spider = new JSpider();
// spider.run({
// 	cat:'18'
// });

function spiderRun(){
	var deferred = Q.defer();
	deferred.resolve();
	return deferred.promise.then(function(){
		var spider = new JSpider({
			cat:'18'
		});
		return spider.run();
	}).then(function(){
		var spider2 = new JSpider({
			cat:'17'
		});
		return spider2.run();
	}).fail(function(err){
		console.log(err);
	});
}
//测试
spiderRun();	