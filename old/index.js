var cheerio = require('cheerio'),
	iconv = require('iconv-lite');
var request = require('request');
var BufferHelper = require('bufferhelper');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('/root/test1024/db/test.db');


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

JSpider.prototype.fetchContent = function(url, calback) {
	var self = this;
	console.log('-------fetch in-------');
	var req = request(url, {
		timeout: 10000,
		pool: false
	});
	console.log('-------fetch 1-------');
	req.setMaxListeners(50);
	console.log('-------fetch 2-------');
	req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
		.setHeader('accept', 'text/html,application/xhtml+xml');
	console.log('-------fetch 3-------');
	req.on('error', function(err) {
		console.log('-------fetch error-------');
		console.log(err);
	});
	console.log('-------fetch 4-------');
	req.on('response', function(res) {
		console.log('-------fetch response-------');
		var bufferHelper = new BufferHelper();
		res.on('data', function(chunk) {
			console.log('-------fetch data-------');
			bufferHelper.concat(chunk);
		});
		res.on('end', function() {
			console.log('-------fetch end-------');
			var result = iconv.decode(bufferHelper.toBuffer(), 'GBK');
			calback(self,result);
		});
	});
}

JSpider.prototype.makeUrl = function(fid, page) {
	return this.o.domain + 'thread0806.php?fid=' + fid + '&page=' + page;
}

JSpider.prototype.buildImgsArray = function(url,listId){
	this.imgs.push({url:url,listId:listId});
	// console.log(this.imgs);

}

JSpider.prototype.fetchImgs = function(){
	console.log(this.imgIndex);
	this.fetchContent(this.imgs[this.imgIndex].url,this.saveImg);
}

JSpider.prototype.saveImg = function(self,result){
	$ = cheerio.load(result);
	theImg = $('img').eq(0);
	if(theImg){
		db.all("SELECT id FROM img where id='" + theImg.attr('src') + "'", function(err, rows) {
			if(!rows){
				console.log('查询失败，不插入');
				self.imgIndex++;
				if(self.imgIndex<self.imgs.length){
					self.fetchImgs();
				}
			}else{
				if(rows.length == 0){
					db.run("INSERT INTO img(id,list_id,src,cat) VALUES ('" + theImg.attr('src') + "','" + self.imgs[self.imgIndex].listId + "','" + theImg.attr('src')+ "','" + self.o.cat +  "')",function(){
						self.imgIndex++;
						console.log('xxxxxxxx 图片保存成功 xxxxxxxxxxx');
						if(self.imgIndex<self.imgs.length){
							self.fetchImgs();
						}

					});
					
				}else{
					console.log('------'+rows.length+'-----图片已存在---------')
					self.imgIndex++;
					if(self.imgIndex<self.imgs.length){
						self.fetchImgs();
					}
				}
			}
			
		});
	}
}

JSpider.prototype.callBackFetch = function(self,result) {
	// console.log(result);
	$ = cheerio.load(result);
	
	$('#ajaxtable tr').each(function(j, elem) {

		if ($(this).find('td').eq(1).find('a').text()) {
			var thisEle = this;
			var id = $(this).find('td').eq(1).find('a').attr('href');
			var title = $(this).find('td').eq(1).find('a').text().trim();
			var url = self.o.domain + $(this).find('td').eq(1).find('a').attr('href');
			var date = $(this).find('td').eq(2).find('.f10').text();
			db.all("SELECT id FROM list where id='" + id + "'", function(err, rows) {
				if(!rows){
					console.log('===================查询失败，不插入===================');
					db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
						if(!rows){
							console.log('-------------------查询失败，不插入--------------------');
						}else{
							if(rows.length == 0 ){
								self.buildImgsArray(url,id);
							}else{
								imgExist();
							}
							loop(self,url,id,thisEle);
						}
					});
				}else{
					if (rows.length == 0) {
						db.run("INSERT INTO list(id,title,date,url) VALUES ('" + id + "','" + title + "','" + date + "','" + url + "')",function(){
							db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
								if(!rows){
									console.log('-------------------查询失败，不插入--------------------');
								}else{
									if(rows.length == 0 ){
										self.buildImgsArray(url,id);
									}else{
										imgExist();
									}
									loop(self,url,id,thisEle);
								}
							});
							console.log(title)
							console.log(url)
							console.log(date)
							console.log('===================插入成功=================');
						});
						
					}else{
						console.log(title)
						console.log(url)
						console.log(date)
						console.log('===================记录已存在=================')
						db.all("SELECT list_id FROM img where list_id='" + id + "'", function(err, rows) {
							if(!rows){
								console.log('-------------------查询失败，不插入--------------------');
							}else{
								if(rows.length == 0 ){
									self.buildImgsArray(url,id);
								}else{
									imgExist();
								}
								loop(self,url,id,thisEle);
							}
						});
					}
				}
				
			});

			// fetchContent(url,function(detail){
			// 	$detail=cheerio.load(detail);
			// 	$detail('img').each(function(i,elem){
			// 		if($(this).css('width')>=400){
			// 			var imgSrc = $(this).attr(src);
			// 			console.log(imgSrc);

			// 		}
			// 	});
			// });
			// console.log(i);
			

		}

		// console.log($(this).text());
	});
	function imgExist(){
		console.log('-----------------------图片已存在-----------------------');
	}
	function loop(self,url,id,thisEle){
		
		if(!$(thisEle).next().find('td').eq(1).find('a').text()){
			self.o.startCount++;
			if (self.o.startCount <= self.o.max) {
				
				self.fetchContent(self.makeUrl(self.o.cat, self.o.startCount.toString()), self.callBackFetch);
			}else{
				self.fetchImgs();
			}
		}
	}
}

JSpider.prototype.run = function(){
	try {
		this.fetchContent(this.makeUrl(this.o.cat, this.o.startCount.toString()), this.callBackFetch);
	} catch (e) {
		console.log('------ooops！-------');
		console.log(e.message);
		console.log('--------------------');
	}
}
module.exports = JSpider;
// }
