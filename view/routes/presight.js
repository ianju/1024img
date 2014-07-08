exports.presight = function(req,res){
	var random = Math.random(10);
	var arrayResult = ['巴西','哥伦比亚'];
	result = random>0.5?arrayResult[0]:arrayResult[1];
	res.send(result.toString()+'胜');
}