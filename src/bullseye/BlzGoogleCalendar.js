/*!
 * Blz.Google.Calendar
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
if (typeof(Blz.Google)=='undefined') Blz.Google={};
Blz.Google.Calendar = {
	url:'https://www.google.com/calendar/',
	baseUrl: 'https://www.google.com/calendar/feeds',
	rgxAllDay: /^([0-9]+)-([0-9]+)-([0-9]+)$/,
	rgxDate: /^([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)/,
	isLoading: false,
	visibility: 'private',
	projection: 'full',
	cacheCalendars:[],
	initialize: function() {
		this.notifyMethodPrefix = 'onGoogleCalendar';
	},
	isHosted: function() { // is Google Apps
		return (this.getMailDomain() != 'gmail.com');
	},
	getUrl: function() {
		var domain = this.getMailDomain();
		if (domain!='gmail.com') { 
			return "https://www.google.com/calendar/hosted/"+domain; 
		}
		return this.url;
	},
	getAccount: function() {
		var mail = this.mail || '';
		return (mail=='' || mail.indexOf('@gmail.com')!=-1) ? 'default' : mail;
	},
	createSessionUrl: function() {
		return this.baseUrl+'/'+this.getAccount()+'/private/full';
	},
	retrieveCalendar: function(context) {
		var w = Blz.Widget;
		var gcal = this;
		
		if (this.isCalendarListRequesting) {
			//w.print("Blz.Google.Calendar.retrieveCalendar: already loading");
			return;
		}
		/*
		if (!this.isLogin) {
			w.print("Blz.Google.Calendar.retrieveCalendar: no login");
			return false;
		}*/
		if (!this.hasSession) {
			w.print("Blz.Google.Calendar.retrieveCalendar: no session");
			this.session();
			return false;
		}
		
		// http://www.google.com/calendar/feeds/default/allcalendars/full
		var u = this.baseUrl + '/'+this.getAccount()+'/allcalendars/full';
		if (this.gsessionid!='') u += '?gsessionid='+this.gsessionid;
		//w.print("Blz.Google.Calendar.retrieveCalendar: try to fetch: " + u);
		var params = {};
		var headers = this.getAuthHeader();
		this.isCalendarListRequesting = true;
		Blz.Ajax.get(u, function(e) {
			try {
				gcal.isCalendarListRequesting = false;
				var xhr = e.response, success = e.success, content = e.data, calendars = [];
				if (xhr.status != 200) w.print("Blz.Google.Calendar.retrieveCalendar: Http Status = "+xhr.status);
				if (success) {
					calendars = gcal.parseCalendars(content);
				} else {
					//w.print("Blz.Google.Calendar.retrieveCalendar: response = "+content);
				}
				if (xhr.status == 401) {
					gcal.hasSession = false;
				}
				gcal.notifyObservers("CalendarRetrieved", {
					success: success,
					context: context,
					items: calendars
				});
			} catch (e) {
				Blz.Widget.print('Blz.Google.Calendar.retrieveCalendar:'+e);
			}
		}, params, headers);
	},
	parseCalendars: function(xmltext) {
		var w = Blz.Widget, calendars = [];
		try {
			var feed = Blz.XML.Parser.string2object(xmltext);
			if (feed.entry.length != null) {
				for (var i = 0, len = feed.entry.length; i < len; i++) {
					var cal = this.createCalendar(feed.entry[i]);
					//for (prop in cal) w.print('cal.'+prop+":"+cal[prop]);
					calendars.push(cal);
				}
			} else {
				var ev = this.createCalendar(feed.entry);
				calendars.push(ev);
			}
		} catch (ex) {
			w.print('Blz.Google.Calendar.parseCalendars:'+ex);
		}
		this.cacheCalendars = calendars;
		return calendars;
	},
	createCalendar: function(c) {
		var id = '', title = '', color = '', link = '', selected = false, hidden = false;
		try {
			//for (prop in c) Blz.Widget.print(prop+":"+c[prop]);
			id = c.id;
			title = c.title;
			link = c.link[0]['href'] || c.link['href']; // TODO:
			color = c['gCal:color']['value'] || '';
			selected = c['gCal:selected']['value']!='false' || false;
			hidden = c['gCal:hidden']['value']!='false' || false;
		} catch (e) {
			Blz.Widget.print("Blz.Google.Calendar.createCalendar: " + e);
		}
		
		return {
			id :id,
			title: title,
			color: color,
			link: link,
			selected: selected,
			hidden: hidden
		};
	},
	retrieveEvent: function(cal, params, context) {
		var gcal = this, w = Blz.Widget;
		/*
		if (!this.isLogin) {
			w.print("Blz.Google.Calendar.retrieveEvent: no login");
			return false;
		}*/
		if (!params) params = {};
		//var u = this.baseUrl + '/default/' + this.visibility + '/' + this.projection+'?gsessionid='+this.gsessionid;
		var u = cal.link;
		if (this.gsessionid!='') u += '?gsessionid='+this.gsessionid;
		if (!this.hasSession) {
			w.print("Blz.Google.Calendar.retrieveEvent: no session!");
			this.session(u);
			return false;
		}
		//w.print("Blz.Google.Calendar.retrieveEvent: try to fetch " + u);
		var headers = this.getAuthHeader();
		Blz.Ajax.get(u, function(e) {
			try {
				var xhr = e.response, success = e.success, content = e.data, events = [];
				if (xhr.status != 200) w.print("Blz.Google.Calendar.retrieveEvent: Http Status = "+xhr.status);
				//var xhr = e.response;
				//var headres = xhr.getAllResponseHeaders;
				//for (prop in headres) Blz.Widget.print(prop+":"+headres[prop]);
				//Blz.Widget.print("fetchEvent:"+content);
				if (success) {
					events = gcal.parseEvents(content);
					// add color
					for (var i = 0, len = events.length; i < len; i++) {
						events[i].color = cal.color;
					}
				} else {
					//w.print("Blz.Google.Calendar.retrieveEvent: response = "+content);
				}
				if (xhr.status == 401) {
					gcal.hasSession = false;
				}
				gcal.notifyObservers("EventRetrieved", {
					success: success,
					context: context,
					items: events
				});
			} catch (e) {
				Blz.Widget.print('Blz.Google.Calendar.retrieveEvent: '+e);
			}
		}, params, headers);
	},
	parseEvents: function(xmltext) {
		var events = [];
		try {
			var feed = Blz.XML.Parser.string2object(xmltext);
			if (feed.entry) {
				if (feed.entry.length != null) {
					for (var i = 0, len = feed.entry.length; i < len; i++) {
						var ev = this.createEvent(feed.entry[i]);
						events.push(ev);
					}
				} else {
					var ev = this.createEvent(feed.entry);
					events.push(ev);
				}
				events.sort(function(a, b) {
					if (a.start == b.start) return (a.end - b.end);
					return a.start - b.start;
				});
			}
		} catch (e) {
			Blz.Widget.print('Blz.Google.Calendar.parseEvents: '+e);
		}
		return events;
	},
	createEvent: function(e) {
		var w = Blz.Widget, id='', link='', title='', description = '', author='', location='';
		var start = 0, end = 0, allDay = 0;
		try {
			//for (prop in e) w.print('event['+prop+"]="+e[prop]);
			id = e.id;
			link = e.link[0]['href'] || e.link['href']; // TODO:
			title = e.title;
			description = e.content;
			author = (e.author && e.author[0]) ? e.author[0].name : "";
			location = (e['gd:where']) ? e['gd:where']['valueString'] : "";

			var allDay = false;
			var when = e['gd:when'];
			if (when) {
				if (when[0]) when = when[0];
				start = when['startTime'] || 0;
				end = when['endTime'] || 0;
				//w.print('start='+start);
				//w.print('end='+end);
			}
			// parse
			var gstart = Blz.GData.Date.fromIso8601(start), gend = Blz.GData.Date.fromIso8601(end);
			allDay = (gstart.isDateOnly() || gend.isDateOnly()) ? 1 : 0;
			start = gstart.date;
			end = gend.date;
			
			/*
			if (match = this.rgxAllDay.exec(start)) {
				allDay = 1;
				start = new Date(match[1], match[2]-1, match[3], 0, 0, 0, 0);
			} else if (match = this.rgxDate.exec(start)) {
				start = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6], 0);
			}
			if (match = this.rgxAllDay.exec(end)) {
				allDay = 1;
				end = new Date(match[1], match[2]-1, match[3], 0, 0, 0, 0);
			}
			else if (match = this.rgxDate.exec(end)) {
				end = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6], 0);
			}*/
		} catch (e) {
			Blz.Widget.print("Blz.Google.Calendar.createEvent: " + e);
		}
		return {
			id: id,
			link: link,
			title: title,
			author: author,
			description: description,
			location: location,
			start: start,
			end: end,
			allDay: allDay
		};
	},
	parseGDataFromJson: function(feed) {
		var events = [];
		for (var i = 0, len = feed.entry.length; i < len; i++) {
			var ev = this.createEventFromJson(feed.entry[i]);
			events.push(ev);
		}
		events.sort(function(a, b) {
			if (a.start == b.start) return (a.end - b.end);
			return a.start - b.start;
		});
		return events;
	},
	createEventFromJson: function(e) {
		try {
			var start = 0, end = 0, allDay = 0;
			var author = (e.author && e.author[0]) ? e.author[0].name.$t : "";
			var location = (e.gd$where && e.gd$where[0]) ? e.gd$where[0] : "";
			
			var allDay = false;
			start = (e.gd$when && e.gd$when[0]) ? e.gd$when[0].startTime || 0 : 0;
			end = (e.gd$when && e.gd$when[0]) ? e.gd$when[0].endTime || 0 : 0;
			if (match = this.rgxAllDay.exec(start)) {
				allDay = 1;
				start = new Date(match[1], match[2]-1, match[3], 0, 0, 0, 0);
			} else if (match = this.rgxDate.exec(start)) {
				start = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6], 0);
			}
			if (match = this.rgxAllDay.exec(end)) {
				allDay = 1;
				end = new Date(match[1], match[2]-1, match[3], 0, 0, 0, 0);
			}
			else if (match = this.rgxDate.exec(end)) {
				end = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6], 0);
			}
		} catch (e) {
			Blz.Widget.print("Blz.Google.Calendar.createEventFromJson: " + e);
		}
		return {
			title: e.title.$t,
			author: author,
			location: location,
			start: start,
			end: end,
			allDay: allDay
		};
	}
};

Blz.Util.extend(Blz.Google.Calendar, Blz.GData);