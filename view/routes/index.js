/* GET home page. */
var sqlite3 = require('sqlite3').verbose();
var offset = 20;
exports.index = function(req, res){
	var db = new sqlite3.Database('/root/test1024/db/test.db');
	var page = parseInt(req.query.page)||0;
	var cat = req.query.cat||18;
	db.all("select count(1) as c from img where cat = '"+cat+"'",function(err,count){
		var length = count[0].c;
		db.all("SELECT t.*,a.date,a.title FROM img t left join list a on t.list_id = a.id where cat = '"+cat+"' ORDER BY a.date desc limit "+offset+" offset "+page*offset, function(err, rows) {
			res.render('index', { 
				title: '男人邦' ,
				listImg:rows,
				pages : length/offset-length%offset/offset,
				currPage : page,
				plusOne: (page+1),
				domain:'http://cl.man.lv/',
				cat:cat
			});
		});
	});
	
  db.close();
};
