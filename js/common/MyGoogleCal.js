/*!
 * MyGoogleCal
 * 
 * MyGoogleCal is released under a permissive MIT license
 * Copyright (c) 2009-2010, makoto_kw (makoto.kw@gmail.com)
 */
var MyGoogleCal = {}
MyGoogleCal.Application = {
	initialize: function() {
		var w = Blz.Widget;
		try {
			this.notifyMethodPrefix = 'onMyGoogleCal';
			// reset member
			this.gcal = Blz.Google.Calendar;
			this.cacheAppts = []; // hash (dt.key => appts)
			this.cacheCalendars = []; // array cal
			// start
			this.gcal.initialize();
			this.gcal.addObserver(this);
			// login 
			var mail = w.getPref("mail");
			var pass = w.getPref("password");
			this.gcal.login(mail,pass);
		} catch (e) {
			w.print("MyGoogleCal.Application.initialize: "+e);
		}
	},
	setUser: function(mail, pass) {
		var w = Blz.Widget, gcal = this.gcal;
		if (gcal.mail != gcal.fixMail(mail) || gcal.pass != pass) {
			this.clearCache();
			gcal.login(mail,pass);
		}
	},
	isLogin: function() {
		return this.gcal.hasSession;
	},
	isLoginRequesting: function() {
		return this.gcal.isLoginRequesting;
	},
	isCalendarListRequesting: function() {
		return this.gcal.isCalendarListRequesting;
	},
	dispose: function() {
		var w = Blz.Widget;
		try {
			this.dispose = true;
		} catch (e) {
			w.print("MyGoogleCal.Application.dispose: "+e);
		}
	},
		
	clearCache: function() {
		this.cacheAppts = [];
	},
	
	appointmentCompare: function(a, b) {
		var diff = a.start - b.start;
		if (diff == 0) {
			if (a.title < b.title) return -1;
			else if (a.title > b.title) return 1;
			else return 0;
		}
		return diff;
	},
	
	findCalendarById: function(id) {
		var cals = this.gcal.cacheCalendars;
		for (var i=0, len=cals.length; i<len; i++) {
			var cal = cals[i];
			if (cal.id==id) return cal;
		}
		return false;
	},
	retrieveAllCalendar: function() {
		this.gcal.retrieveCalendar();
	},
	
	getAppointments: function(dt) {
		var w = Blz.Widget;
		try {
			var key = dt.toKeyString();
			var cache = this.cacheAppts[key] || {loaded:false,loading:false};
			if (!cache.loaded) {
				if (!cache.loading) {
					cache.items = {};
					cache.loading = true;
					cache.loadingCount = 0;
					var date = dt.date;
					var start = new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
					var end = new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59,0);
					var params = {
						'start-min':Blz.GData.Date.toDateString(start),
						'start-max':Blz.GData.Date.toDateString(end)
					};
					w.print('MyGoogleCal.Application.getAppointments from '+params['start-min']+' to '+params['start-max']);
					var cals = this.gcal.cacheCalendars;
					for (var i=0, len=cals.length; i<len; i++) {
						var cal = cals[i];
						this.gcal.retrieveEvent(cal, params, {dt:key,calid:cal.id});
						cache.loadingCount++;
					}
					this.cacheAppts[key] = cache;
				}
			}
		} catch (e) {
			w.print("MyGoogleCal.Application.getAppointments: "+e);
		}
		return cache;
	},
	
	// utils
	ellipseString: function(maxLength){
		if (this.length > maxLength) {
			return this.substr(0, maxLength - 3) + '...';
		}
		return this;
	},
	
	onGoogleCalendarLoginCompleted: function(sender, event) {
		var w = Blz.Widget;
		w.print("MyGoogleCal.Application.onGoogleCalendarEventRetrieved:");
		this.notifyObservers("LoginCompleted", event);
	},
	onGoogleCalendarCalendarRetrieved: function(sender, event) {
		var w = Blz.Widget;
		w.print("MyGoogleCal.Application.onGoogleCalendarRetrieved: calendar count = "+event.items.length);
		this.notifyObservers("CalendarLoaded", event);
	},
	onGoogleCalendarEventRetrieved: function(sender, event) {
		var w = Blz.Widget;
		w.print("MyGoogleCal.Application.onGoogleCalendarEventRetrieved: event count = "+event.items.length);
		try {
			var context = event.context;
			var key = context.dt;
			var calid = context.calid;
			var events = event.items || [];
			var cache = this.cacheAppts[key];
			cache.loadingCount--;
			cache.items[calid] = events;
			if (cache.loadingCount==0) {
				cache.loaded = true;
				cache.loading = false;
				this.notifyObservers("EventLoaded", {key:key});
			}
		} catch (e) {
			w.print("MyGoogleCal.Application.onGoogleCalendarEventRetrieved:"+e);
		}
	}
};

Blz.Util.extend(MyGoogleCal.Application,Blz.Notifier);