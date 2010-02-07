/*!
 * Blz.GData
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.GData = {
	authUrl: 'https://www.google.com/accounts/ClientLogin', // ClientLogin for installed app
	sessionUrl:'',
	isLoginRequesting: false,
	isLogin: false,
	hasSession: false,
	mail: '',
	pass: '',
	source: '',
	authContent: '',
	gsessionid:'',
	
	fixMail: function(mail) {
		if (mail.indexOf('@') == -1) {
			mail += '@gmail.com';
		}
		return mail;
	},
	
	login: function(mail, pass, sessionUrl) {
		this.isLogin = false;
		this.hasSession = false;
		
		if (mail=='' && pass=='')
			return false;
		
		if (mail && pass) {
			this.mail = this.fixMail(mail);
			this.pass = pass;
		}
		// TODO:
		var postData = {
			accountType: 'HOSTED_OR_GOOGLE',
			Email: this.mail,
			Passwd: this.pass,
			service: 'cl',
			source: this.source
		}
		this.isLoginRequesting = true;
		var u = this.authUrl;
		var s = sessionUrl || this.sessionUrl;
		var gdata = this;
		Blz.Ajax.post(u, postData, function(e) {
			gdata.isLoginRequesting = false;
			if (e.success) {
				if (e.success = gdata.parseAuthContent(e.data)) {
					gdata.isLogin = true;
					gdata.hasSession = false;
					if (s) gdata.session(s);
					else gdata.notifyObservers("LoginCompleted", e);
				}
			}
			else {
				// reset
				gdata.isLogin = false;
				gdata.authContent = '';
				gdata.notifyObservers("LoginCompleted", e);
			}
		});
	},
	session:function(url) {
		var gdata = this;
		gdata.isLoginRequesting = true;
		gdata.gsessionid = '';
		
		// TODO:
		var headers = this.getAuthHeader();
		var request = new XMLHttpRequest();
		
		if (typeof(request.autoRedirect)!='undefined') {
			request.autoRedirect = false; // for Yahoo Widget Engine
		}
		request.open("GET", url, true);
		for (prop in headers) {
			if (headers.hasOwnProperty(prop)) {
				request.setRequestHeader(prop, headers[prop]);
			}
		}
		request.onreadystatechange = function() {
			if (this.readyState==4) {
				gdata.isLoginRequesting = true;
				Blz.Widget.print("Blz.GData.session: sestion http status = "+this.status);
				if (this.status==302) {
					var headers = this.getAllResponseHeaders();
					for (var i=0,len=headers.length; i<len; i++) {
						var h = headers[i];
						if (match = /gsessionid=([\w-_]+)$/.exec(headers[i])) {
							gdata.gsessionid = match[1];
							gdata.hasSession = true;
						}
					}
				} else if (this.status==200) {
					gdata.hasSession = true; // TODO:
				}
				if (this.status==200||this.status==302) {
					gdata.isLoginRequesting = false;
					gdata.notifyObservers("LoginCompleted", {success:true, response:this});
				} else {
					gdata.isLoginRequesting = false;
					gdata.notifyObservers("LoginCompleted", {success:false, response:this});
				}
			}
		}
		request.send();
		
	},
	getAuthHeader: function() {
		return {
			'Authorization': 'GoogleLogin auth=' + this.authContent,
			'GData-Version': 2
		};
	},
	parseAuthContent: function(content) {
		var match;
		if (match = /Auth=([\w-_]+)/.exec(content)) {
			this.authContent = match[1];
			return true;
		}
		return false;
	}
};

Blz.Util.extend(Blz.GData, Blz.Notifier);
