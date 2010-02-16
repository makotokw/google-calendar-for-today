/*!
 * Blz.GData.Date
 *
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.GData.Date = function(dt, dateOnly) {
	this.date = dt || new Date();
	this.dateOnly = dateOnly === true;
	return this;
}
Blz.Util.extend(Blz.GData.Date, {
	fromIso8601: function(isoString) {
		var year = parseInt(isoString.substring(0, 4), 10), month = parseInt(isoString.substring(5, 7), 10) - 1, dayOfMonth = parseInt(isoString.substring(8, 10), 10);
		if (isoString.toUpperCase().indexOf("T") == -1) {
			return new Blz.GData.Date(new Date(year, month, dayOfMonth), true);
		}
		var hours = parseInt(isoString.substring(11, 13), 10), minutes = parseInt(isoString.substring(14, 16), 10), seconds = parseInt(isoString.substring(17, 19), 10), milliseconds = parseInt(isoString.substring(20, 23), 10), d = new Date(year, month, dayOfMonth, hours, minutes, seconds, milliseconds);
		if (isoString.length > 23) {
			var offset = 0, tzChar = isoString.charAt(23);
			if (tzChar !== "Z") {
				var tzHours = parseInt(isoString.substring(24, 26), 10), tzMinutes = parseInt(isoString.substring(27, 29), 10);
				offset = tzHours * 60 + tzMinutes;
				if (tzChar !== "-") {
					offset = -offset
				}
			}
			offset -= d.getTimezoneOffset();
			if (offset != 0) {
				d.setTime(d.getTime() + offset * 60000);
			}
		}
		return new Blz.GData.Date(d);
	},
	padNumber: function(number, length) {
		var result = number.toString();
		while (result.length < length) 
			result = '0' + result;
		return result;
	},
	getTimezoneOffsetString: function(date) {
		var tz, offset = date.getTimezoneOffset();
		if (offset == 0) {
			tz = "Z";
		}
		else {
			var n = Math.abs(offset) / 60, h = Math.floor(n), m = (n - h) * 60;
			tz = (offset > 0 ? "-" : "+") + this.padNumber(h, 2) + ":" + this.padNumber(m, 2);
		}
		return tz;
	},
	toIso8601: function(dateTime) {
		var isDateTime = dateTime instanceof Blz.GData.Date, date = isDateTime ? dateTime.date : dateTime, dateOnlyPart = date.getFullYear() + "-" + this.padNumber(date.getMonth() + 1, 2) + "-" + this.padNumber(date.getDate(), 2);
		if (isDateTime && dateTime.isDateOnly()) {
			return dateOnlyPart;
		}
		return dateOnlyPart + "T" + this.padNumber(date.getHours(), 2) + ":" + this.padNumber(date.getMinutes(), 2) + ":" + this.padNumber(date.getSeconds(), 2) + "." + this.padNumber(date.getMilliseconds(), 3) + this.getTimezoneOffsetString(date)
	},
	toDateString: function(dt) {
		// YYYY-MM-DDT00:00:00
		dt = dt || this.date;
		// var y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
		// var hou=dt.getUTCHours(), min=dt.getUTCMinutes(),
		// sec=dt.getUTCSeconds();
		var y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate();
		var hou = dt.getHours(), min = dt.getMinutes(), sec = dt.getSeconds();
		if (m < 10) 
			m = '0' + m;
		if (d < 10) 
			d = '0' + d;
		if (hou < 10) 
			hou = '0' + hou;
		if (min < 10) 
			min = '0' + min;
		if (sec < 10) 
			sec = '0' + sec;
		
		var offset = dt.getTimezoneOffset();
		if (offset == 0) {
			offset = '';
		}
		else {
			var ohou = offset / 60;
			var omin = offset % 60;
			var o = (ohou > 0) ? '-' : '+';
			if (ohou < 0) 
				ohou *= -1;
			if (ohou < 10) 
				ohou = '0' + ohou;
			if (omin < 10) 
				omin = '0' + omin;
			offset = o + ohou + ':' + omin;
		}
		return y + '-' + m + '-' + d + 'T' + hou + ':' + min + ':' + sec + offset;
	}
});

Blz.GData.Date.prototype = {
	addDays: function(d) {
		var ms = this.date.getTime() + (24 * 3600000 * d);
		this.date.setTime(ms);
		return this;
	},
	getYear: function() {
		return this.date.getFullYear();
	},
	getMonth: function() {
		return this.date.getMonth() + 1;
	},
	getDate: function() {
		return this.date.getDate();
	},
	getDay: function() {
		return this.date.getDay();
	},
	isWeekend: function() {
		return (this.getDay() == 0 || this.getDay() == 6) ? true : false;
	},
	isDateOnly: function() {
		return this.dateOnly;
	},
	setDateOnly: function(dateOnly) {
		this.dateOnly = dateOnly;
	},
	resetHours: function() {
		this.date.setHours(0, 0, 0, 0);
		return this;
	},
	clone: function() {
		return new Blz.GData.Date(new Date(this.date));
	},
	
	asDate: function() {
		return new Date(this.date);
	},
	
	compare: function(d) {
		return (this.date - d.date);
	},
	
	toKeyString: function() {
		return this.toString();
	},
	toString: function() {
		// YYYY-MM-DD
		var y = this.getYear(), m = this.getMonth(), d = this.getDate();
		m = (m < 10) ? "0" + m : "" + m;
		d = (d < 10) ? "0" + d : "" + d;
		return "" + y + "-" + m + "-" + d;
	},
	toLocaleShortString: function() {
		var y = this.getYear(), m = this.getMonth(), d = this.getDate();
		var UKdate = Boolean(new Date("27/12/2004").getDay());
		var USdate = Boolean(new Date("12/27/2004").getDay());
		Blz.Widget.print("UKdate = " + UKdate);
		Blz.Widget.print("USdate = " + USdate);
		var UKtype = !+new Date('32/12/1969 Z') // zero time ?
		var UStype = !+new Date('12/32/1969 Z') // zero time ?
		Blz.Widget.print("UKtype = " + UKtype);
		Blz.Widget.print("UStype = " + UStype);
		m = (m < 10) ? "0" + m : "" + m;
		d = (d < 10) ? "0" + d : "" + d;
		return (UKdate) ? "" + d + "/" + m + "/" + y : "" + m + "/" + d + "/" + y;
	}
}
