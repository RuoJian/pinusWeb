var pinus = window.pinus;
var username;
var users;
var rid;
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";
var accountGid = "";

util = {
	urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
	//  html sanitizer
	toStaticHTML: function(inputHtml) {
		inputHtml = inputHtml.toString();
		return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	//pads n with zeros on the left,
	//digits is minimum length of output
	//zeroPad(3, 5); returns "005"
	//zeroPad(2, 500); returns "500"
	zeroPad: function(digits, n) {
		n = n.toString();
		while(n.length < digits)
		n = '0' + n;
		return n;
	},
	//it is almost 8 o'clock PM here
	//timeString(new Date); returns "19:49"
	timeString: function(date) {
		var minutes = date.getMinutes().toString();
		var hours = date.getHours().toString();
		return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
	},

	//does the argument only contain whitespace?
	isBlank: function(text) {
		var blank = /^\s*$/;
		return(text.match(blank) !== null);
	}
};

/** 
 * 获得空闲连接服conn信息
 * @param {*} uid 	邮件*密码的组合
 * @param {*} callback 回掉函数，返回conn消息
 */
function queryEntry(uid, callback) {
	var host = $('#Host').val();	//gate服IP地址
	var clientPort = $('#ClientPort').val();	//gate服的客户端端口 1001
    var route = 'gate.gateHandler.getConnector';	//gate路由。gate.gateHandler.getConnector 到gate获得空间的链接信息conn
	//alert(uid);
	pinus.init({
		host: host,
		port: clientPort,
		log: true,
		wss: true,
	}, function() {
		pinus.request(route, {accountId: uid}, function(data) {
			let resData = data.data;
			console.log(data);
			pinus.disconnect();	//获取到链接服conn的信息主动断开连接
			callback(resData);
		});
	});
};

//页面刷新下拉列表默认显示登录协议
function defaultShowLogin(){
	let value = document.getElementById("connector.connHandler.login").value;
	document.getElementById('data').value = value;
	let sel = document.getElementById("route");
	let opts = sel.getElementsByTagName("option");
	opts[0].selected = true;
    //connector.connHandler.login
    let routStr = document.getElementById("routeStr");
    routStr.value = "connector.connHandler.login";
    
};

$(document).ready(function() {
	//页面刷新默认选中登录协议
	defaultShowLogin();
	pinus.on('onPushMsg', function(data){
		console.log(data);
		return;
	});
	$("#wsConn").click(() => {
		pinus.init({
			host: $('#Host').val(),
			port: $('#ClientPort').val(),
			log: true,
			wss: $('#wss').prop("checked"),
		}, function() {
		});
	});
	//测试获取连接服信息协议使用
	$("#getConn").click(function(){
		let accountId = $("#accountId").val();
		if(!accountId){
			alert('测试账号不能为空');
			return;
		}
		queryEntry(accountId, function(msg){
			if(msg){
				$('#Host').val(msg.host);
				$('#ClientPort').val(msg.port);
				pinus.init({
					host: msg.host,
					port: msg.port,
					log: true
				}, () => {});
				return;
			}
			alert(JSON.stringify(msg));
		});
	});
	//协议类型变化时显示对应的发送消息例子
	$('#route').on("change", function(){
		var selectType = $(this).val();
		var value = document.getElementById(selectType).value;
		document.getElementById('data').value = value;
		$('#routeStr').val(selectType);
    });
    
	//登录
	$("#login").click(function() {
		var host = $('#Host').val();
		var port = parseInt($('#ClientPort').val());
		var route = $('#route').val();
		var str = $('#data').val();
		if(!host || !port || !route || !str){
			alert('clientHost or ClientPort or route or sendData is null.');
			return;
		}
		if(route != "connector.connHandler.login"){
			alert('请选择 <发送协议 或 注册> 按钮');
			return;
		}
		var msg = JSON.parse(str);
		pinus.init({host: host, port: port, log: true}, function() {
			pinus.request(route, msg, function(data) {
				let dataStr = JSON.stringify(data);
				dataStr += " ---- code: " + data.code + ", desc: " + ErrorCode[data.code];
				document.getElementById('showResult').innerHTML="<div class='result'>" + dataStr + "</div>";
				if (data.data) {
					accountGid = data.data.gId;
				}
			});
		});
	});
	//注册
	$("#register").click(function() {
		var host = $('#Host').val();
		var port = parseInt($('#ClientPort').val());
		var route = $('#route').val();
		var str = $('#data').val();
		if(!host || !port || !route || !str){
			alert('clientHost or ClientPort or route or sendData is null.');
			return;
		}
		if(route != "connector.connHandler.register"){
			alert('请选择 <发送协议 或 登录> 按钮');
			return;
		}
		var msg = JSON.parse(str);
		pinus.init({host: host, port: port, log: true}, function() {
			pinus.request(route, msg, function(data) {
				let dataStr = JSON.stringify(data);
				dataStr += " ---- code: " + data.code + ", desc: " + ErrorCode[data.code];
				pinus.disconnect(); //注册成功断开连接，重新登录游戏
				document.getElementById('showResult').innerHTML="<div class='result'>" + dataStr + "</div>";
			});
		});
    });
    //游客登录
	$("#quickLogin").click(function() {
		var host = $('#Host').val();
		var port = parseInt($('#ClientPort').val());
		var route = $('#route').val();
		var str = $('#data').val();
		if(!host || !port || !route || !str){
			alert('clientHost or ClientPort or route or sendData is null.');
			return;
		}
		if(route != "connector.connHandler.quickLogin"){
			alert('请选择<游客登录>选项');
			return;
		}
		var msg = JSON.parse(str);
		pinus.init({host: host, port: port, log: true}, function() {
			pinus.request(route, msg, function(data) {
				let dataStr = JSON.stringify(data);
				dataStr += " ---- code: " + data.code + ", desc: " + ErrorCode[data.code];
				//pinus.disconnect();
				document.getElementById('showResult').innerHTML="<div class='result'>" + dataStr + "</div>";
				if (data.data) {
					accountGid = data.data.gId;
				}
			});
		});
	});
	//send other message
	$("#loginAll").click(function() {
		var host = $('#Host').val();
		var port = $('#ClientPort').val();
		var route = $('#routeStr').val() || $('#route').val();
        var str = $('#data').val();
        
		if(!host || !port || !route || !str){
			alert('clientHost or ClientPort or route or sendData is null.');
			return;
		}
		if(route == "connector.connHandler.login"){
			document.getElementById('login').click();
			return;
		} else if(route == "connector.connHandler.quickLogin"){
			document.getElementById('quickLogin').click();
			return;
		}

        var msg = JSON.parse(str);
		if (msg.accountGid != undefined && accountGid) {
			msg.accountGid = accountGid;
		}
		pinus.request(route, msg, function(data) {
            var dataStr = JSON.stringify(data);
			if(data && data.code != 0){
				let index = parseInt(data.code);
				dataStr += " ---- code: " + data.code + ", desc: " + ErrorCode[index];
            }
            if(data){
                document.getElementById('showResult').innerHTML="<div class='result'>" + dataStr + "</div>";
				console.log(data);
            }
		});
	});
});