var cheerio = require('cheerio'),
	iconv = require('iconv-lite');
var request = require('request');
var BufferHelper = require('bufferhelper');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('/root/test1024/db/test.db');

var Q  = require('q');

var JSpider = function(options) {
	this.o = {};
	this.imgs = new Array();
	this.imgIndex = 0;
	this.defaults = {
		startCount : 1,
		max : 5,
		cat : '18',
		domain:'http://cl.man.lv/'
	};

	if(options){
		this.o.startCount = options.startCount?options.startCount:this.defaults.startCount;
		this.o.max = options.max?options.max:this.defaults.max;
		this.o.cat = options.cat?options.cat:this.defaults.cat;
		this.o.domain = options.domain?options.domain:this.defaults.domain;
	}else{
		this.o = this.defaults;
		console.log(JSON.stringify(this.defaults));
		console.log(JSON.stringify(this.o));
	}
	
/*
fid 2 wuma yc
fid 17 wuma zt
fid 15 youma yc
fid 18 youma zt
fid 4 oumei yc
fid 19 oumei zt
fid 5 dongman yc
fid 24 dongman zt
*/

}

JSpider.prototype.test = function(result){
	var deferred = Q.defer();
	deferred.resolve('------success-----');
	return deferred.promise;
}


JSpider.prototype.run = function(){
	var deferred = Q.defer();
	//try {
		var param = {};
		param.self = this;
		deferred.resolve(param);
		return deferred.promise.then(function(param){
			return param.self.fetchContent(param);
		}).then(function(param){
			return param.self.analysis(param);
		}).then(function(param){
			return param.self.loopImg(param);
		}).then(function(param){
			console.log(param.self.imgs.length)
			console.log('+++++++ all set ! ++++++++')
			deferred.resolve();
			return deferred.promise;
		}).fail(function(err){
			console.log('xxxxxx')
			console.log(err)
		});
	//} catch (e) {
	//	console.log('------ooops！-------');
	//	console.log(e.message);
	//	console.log('--------------------');
	//}
	//return deferred.promise;
}

JSpider.prototype.makeUrl = function(fid, page) {
	return this.o.domain + 'thread0806.php?fid=' + fid + '&page=' + page;
}


JSpider.prototype.fetchContent = function(param) {
	var self = param.self;
	var deferred = Q.defer();
     
	console.log('-------fetch in-------');

	var req = request(param.target?param.target:param.self.makeUrl(param.self.o.cat, param.self.o.startCount.toString()), {
		timeout: 10000,
		pool: false
	});
	req.setMaxListeners(50);
	req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
		.setHeader('accept', 'text/html,application/xhtml+xml');
	req.on('error', function(err) {
		
		console.log(err);
		param.result = '';
		deferred.resolve(param)

	});
	req.on('response', function(res) {
		console.log('-------fetch response-------');
		var bufferHelper = new BufferHelper();
		res.on('data', function(chunk) {
			// console.log('-------fetch data-------');
			bufferHelper.concat(chunk);
		});
		res.on('end', function() {
			console.log('-------fetch end-------');
			var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
			param.result = result;
			deferred.resolve(param);
		});
	});
	return deferred.promise;
}

JSpider.prototype.dbAllList = function(param){
	var deferred = Q.defer();
	param.existed =false;
	//console.log(param.id)
	//deferred.resolve(param);
	db.all("SELECT id FROM list where id='" + param.id + "'", function(err, rows) {
		if(err){
			deferred.reject(err);
		}else if(!rows){
			deferred.reject('!rows');
		}else if(rows.length !=0){
			param.existed = true;
			deferred.resolve(param);
		}else if(rows.length ==0){
			deferred.resolve(param);
		}
	});
	return deferred.promise;
}

JSpider.prototype.dbAllImg = function(param){
	var deferred = Q.defer();
	param.existed =false;
	//console.log(param.id)
	//deferred.resolve(param);
	db.all("SELECT id FROM img where id='" + param.target + "'", function(err, rows) {
		if(err){
			deferred.reject(err);
		}else if(!rows){
			deferred.reject('!rows');
		}else if(rows.length !=0){
			param.existed = true;
			deferred.resolve(param);
		}else if(rows.length ==0){
			deferred.resolve(param);
		}
	});
	return deferred.promise;
}

JSpider.prototype.dbInsertList = function(param){
	var deferred = Q.defer();
	// console.log('param.title'+param.title)
	// console.log('title'+ title);
	// deferred.resolve(title);
	db.run("INSERT INTO list(id,title,date,url) VALUES ('" + param.id + "','" + param.title + "','" + param.date + "','" + param.url + "')",function(err){
		if(err){
			deferred.reject(err)
		}else{
			console.log('--------insert success------')
			deferred.resolve(param);
		}
	})
	return deferred.promise;
}

JSpider.prototype.dbInsertImg = function(param){
	var deferred = Q.defer();
	// console.log('param.title'+param.title)
	// console.log('title'+ title);
	// deferred.resolve(title);
	if(param.theImgSrc && param.listId){
		db.run("INSERT INTO img(id,list_id,src,cat) VALUES ('" + param.theImgSrc + "','" + param.listId + "','" + param.theImgSrc+ "','" + param.self.o.cat +  "')",function(err){
			if(err){
				deferred.reject(err)
			}else{
				console.log('--------insert success------')
				deferred.resolve(param);
			}
		})
	}
	return deferred.promise;
}


JSpider.prototype.loopTR = function(param){
	var deferred = Q.defer();
	param.id = id = '';
	param.url = '';
	param.date = '';
	param.title = '';
	param.done = false;
	if(param.result){
		$ = cheerio.load(param.result);
	
		console.log('rendering '+param.loopTRIndex+' of '+$('#ajaxtable tr').length)
		if(param.loopTRIndex<$('#ajaxtable tr').length){ //TODO: get rid of the -100
			if($('#ajaxtable tr').eq(param.loopTRIndex).find('td').eq(1).find('a').text().trim()){

				param.id = id = $('#ajaxtable tr').eq(param.loopTRIndex).find('td').eq(1).find('a').attr('href');
				param.url = url = param.self.o.domain + $('#ajaxtable tr').eq(param.loopTRIndex).find('td').eq(1).find('a').attr('href');
				param.date = date = $('#ajaxtable tr').eq(param.loopTRIndex).find('td').eq(2).find('.f10').text();
				param.title = $('#ajaxtable tr').eq(param.loopTRIndex).find('td').eq(1).find('a').text().trim();
			}
			param.loopTRIndex++;
			deferred.resolve(param);
		}else{
			param.done = true;
			//console.log('resolved!')
			deferred.resolve(param);
		}
		if(param.title){
			console.log(param.title)
		}
	}else{
		deferred.resolve(param);
		return deferred.promise;
	}
	

	//then
	if(param.done){
		param.done = false;
		return deferred.promise;
	}else{
		return deferred.promise.then(function(param){
				return param.self.dbAllList(param);
		}).then(function(param){
				if(param.existed == false){
					param.self.buildImgsArray(param);
					return param.self.dbInsertList(param);
				}else{
					param.existed = false;
					console.log('----the record\'s existed----');
					return deferred.promise;
				}
		}).then(function(param){
				return param.self.loopTR(param);
		})
		.fail(function(err){
			console.log(err);
		});
	}
}

JSpider.prototype.loopPage = function(param){
	console.log('======loopPage')
	var deferred = Q.defer();
	param.loopTRIndex = 0;
	param.allDone = false;
	if(param.self.o.startCount<=param.self.o.max){
		param.self.o.startCount++;	
		deferred.resolve(param);
	}else{
		param.allDone = true;
		deferred.resolve(param);
	}
	if(param.allDone){
		return deferred.promise;
	}else{
		return deferred.promise.then(function(param){
			return param.self.loopTR(param)
		}).then(function(param){
			console.log('+++++++++ page '+(param.self.o.startCount-1)+' resolved!! ++++++++');
			
			if(param.self.o.startCount>param.self.o.max){
				return deferred.promise;
			}else{
				return param.self.fetchContent(param);
			}
		}).then(function(param){
			return param.self.loopPage(param);
		}).fail(function(err){
			console.log(err);
		});
	}
}

JSpider.prototype.loopImg = function(param){
	console.log('Img============'+param.self.imgIndex+' of '+param.self.imgs.length);
	var deferred = Q.defer();
	param.imgDone = false;
	param.target = '';
	param.listId  = '';
	if(param.self.imgIndex < param.self.imgs.length){
		param.target = param.self.imgs[param.self.imgIndex].url;
		param.listId = param.self.imgs[param.self.imgIndex].listId;
		param.self.imgIndex ++;
		deferred.resolve(param);
	}else{
		param.imgDone = true;
		deferred.resolve(param);
	}
	
	if(param.imgDone){
		return deferred.promise;
	}else{
		return deferred.promise.then(function(param){
			param.result = '';
			return param.self.fetchContent(param);
		}).then(function(param){
			return param.self.saveImg(param);
		}).then(function(param){
			return param.self.loopImg(param);
		});
	}
}

JSpider.prototype.saveImg = function(param){
	var deferred = Q.defer();
	param.theImgSrc == '';
	param.imgGot = false;
	if(param.result){
		$ = cheerio.load(param.result);
		theImg = $('img').eq(0);
		if(theImg[0]){
			param.theImgSrc = theImg.attr('src');
			param.imgGot = true;
			deferred.resolve(param);
		}else{
			deferred.resolve(param);
		}
	}else{
		deferred.resolve(param);
		return deferred.promise;
	}
	if(!param.imgGot){
		return deferred.promise;
	}else{
		return deferred.promise.then(function(param){
			return param.self.dbAllImg(param);
		}).then(function(param){
			return param.self.dbInsertImg(param);
		});
	}
}

JSpider.prototype.analysis = function(param){
	console.log('analysis===========')
	var deferred = Q.defer();
	param.loopTRIndex = 0;
	deferred.resolve(param);
	return deferred.promise.then(function(param){
		return param.self.loopPage(param);
	}).fail(function(err){
		console.log(err);
	});
}

JSpider.prototype.buildImgsArray = function(param){
	console.log(param.url);
	console.log(param.id);
	if(param.url && param.id){
		console.log('building imgs array');
		param.self.imgs.push({url:param.url,listId:param.id});
	}
	// console.log(this.imgs);
}

// JSpider.prototype.callBackFetch = function(self,result) {
// 	// console.log(result);
// 	$ = cheerio.load(result);
// 	var deferred = Q.defer();
	
// 	$('#ajaxtable tr').each(function(j, elem) {

// 		if ($(this).find('td').eq(1).find('a').text()) {
// 			var thisEle = this;
// 			var id = $(this).find('td').eq(1).find('a').attr('href');
// 			var title = $(this).find('td').eq(1).find('a').text().trim();
// 			var url = self.o.domain + $(this).find('td').eq(1).find('a').attr('href');
// 			var date = $(this).find('td').eq(2).find('.f10').text();
// 			db.all("SELECT id FROM list where id='" + id + "'", function(err, rows) {
// 				if(!rows){
// 					console.log('===================查询失败，不插入===================');
// 					db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
// 						if(!rows){
// 							console.log('-------------------查询失败，不插入--------------------');
// 						}else{
// 							if(rows.length == 0 ){
// 								self.buildImgsArray(url,id);
// 							}else{
// 								imgExist();
// 							}
// 							loop(self,url,id,thisEle);
// 						}
// 					});
// 				}else{
// 					if (rows.length == 0) {
// 						db.run("INSERT INTO list(id,title,date,url) VALUES ('" + id + "','" + title + "','" + date + "','" + url + "')",function(){
// 							db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
// 								if(!rows){
// 									console.log('-------------------查询失败，不插入--------------------');
// 								}else{
// 									if(rows.length == 0 ){
// 										self.buildImgsArray(url,id);
// 									}else{
// 										imgExist();
// 									}
// 									loop(self,url,id,thisEle);
// 								}
// 							});
// 							console.log(title)
// 							console.log(url)
// 							console.log(date)
// 							console.log('===================插入成功=================');
// 						});
						
// 					}else{
// 						console.log(title)
// 						console.log(url)
// 						console.log(date)
// 						console.log('===================记录已存在=================')
// 						db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
// 							if(!rows){
// 								console.log('-------------------查询失败，不插入--------------------');
// 							}else{
// 								if(rows.length == 0 ){
// 									self.buildImgsArray(url,id);
// 								}else{
// 									imgExist();
// 								}
// 								loop(self,url,id,thisEle);
// 							}
// 						});
// 					}
// 				}
				
// 			});

// 			// fetchContent(url,function(detail){
// 			// 	$detail=cheerio.load(detail);
// 			// 	$detail('img').each(function(i,elem){
// 			// 		if($(this).css('width')>=400){
// 			// 			var imgSrc = $(this).attr(src);
// 			// 			console.log(imgSrc);

// 			// 		}
// 			// 	});
// 			// });
// 			// console.log(i);
			

// 		}

// 		// console.log($(this).text());
// 	});
// 	function imgExist(){
// 		console.log('-----------------------图片已存在-----------------------');
// 	}
// 	function loop(self,url,id,thisEle){
		
// 		if(!$(thisEle).next().find('td').eq(1).find('a').text()){
// 			self.o.startCount++;
// 			if (self.o.startCount <= self.o.max) {
// 				deferred.resolve('-----------insert success------------');
// 				self.fetchContent(self.makeUrl(self.o.cat, self.o.startCount.toString()), self.callBackFetch);
// 			}else{
// 				self.fetchImgs();
// 			}
// 		}
// 	}
// 	return deferred.promise;
// }


module.exports = JSpider;