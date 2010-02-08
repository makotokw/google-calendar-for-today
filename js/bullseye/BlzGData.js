/*!
 * Blz.GData
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.GData = {
	source:'',
	hasSession:false,
	useGoogleLogin:true,
	loginUrl: 'https://www.google.com/accounts/ClientLogin', // ClientLogin for installed app
	isLoginRequesting:false,
	isLogin:false,
	mail:'',
	pass:'',
	authContent:'',
	gsessionid:'',
	
	fixMail: function(mail) {
		if (mail.indexOf('@') == -1) {
			mail += '@gmail.com';
		}
		return mail;
	},
	
	getMailDomain: function() {
		var mail = this.mail || '';
		if (mail.indexOf('@') != -1) {
			return mail.substr(mail.indexOf('@')+1); 
		}
		return 'gmail.com';
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
		var u = this.loginUrl, s = sessionUrl || this.createSessionUrl();
		var gdata = this;
		gdata.isLoginRequesting = true;
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
	logout: function() {
		if (this.isLoginRequesting) {
			Blz.Widget.print("Blz.GData.logout: logout failed");
			return; // TODO:
		}
		// reset
		this.mail = '';
		this.pass = '';
		this.isLogin = false;
		this.hasSession = false;
		this.authContent = '';
		this.gsessionid = '';
	},
	session:function(url) {
		var gdata = this, url = url || this.createSessionUrl();
		gdata.isLoginRequesting = true;
		gdata.gsessionid = '';
		
		var request = new XMLHttpRequest();
		if (typeof(request.autoRedirect)!='undefined') {
			request.autoRedirect = false; // for Yahoo Widget Engine
		}
		request.open("GET", url, true);
		var headers = this.getAuthHeader();
		for (prop in headers) {
			if (headers.hasOwnProperty(prop)) {
				request.setRequestHeader(prop, headers[prop]);
			}
		}
		request.onreadystatechange = function() {
			if (this.readyState==4) {
				gdata.isLoginRequesting = false;
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
				gdata.notifyObservers("LoginCompleted", {success:(this.status==200||this.status==302), response:this});
			}
		}
		request.send();
		
	},
	getAuthHeader: function() {
		var headers = {
			'GData-Version': 2
		};
		if (this.useGoogleLogin) {
			headers['Authorization'] = 'GoogleLogin auth=' + this.authContent;
		}
		return headers;
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
