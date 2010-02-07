/*!
 * Blz.GData.Date
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.GData.Date = function(dt) {
	this.date = dt || new Date();
	return this;
}
Blz.Util.extend(Blz.GData.Date, {
	toDateString: function(dt) {
		//YYYY-MM-DDT00:00:00
		dt = dt || this.date;
		//var y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
		//var hou=dt.getUTCHours(), min=dt.getUTCMinutes(), sec=dt.getUTCSeconds();
		var y=dt.getFullYear(), m=dt.getMonth()+1, d=dt.getDate();
		var hou=dt.getHours(), min=dt.getMinutes(), sec=dt.getSeconds();
		if (m<10) m = '0'+m;
		if (d<10) d = '0'+d;
		if (hou<10) hou = '0'+hou;
		if (min<10) min = '0'+min;
		if (sec<10) sec = '0'+sec;
		
		var offset = dt.getTimezoneOffset();
		if (offset==0) {
			offset = '';
		} else {
			var ohou = offset/60;
			var omin = offset%60;
			var o = (ohou>0) ? '-' : '+';
			if (ohou<0) ohou*=-1;
			if (ohou<10) ohou = '0'+ohou;
			if (omin<10) omin = '0'+omin;
			offset = o+ohou+':'+omin;
		}
		return y+'-'+m+'-'+d+'T'+hou+':'+min+':'+sec+offset;
	}
});

Blz.GData.Date.prototype = {
	addDays:function(d) {
		var ms = this.date.getTime()+(24*3600000*d);
		this.date.setTime(ms);
		return this;
	},
	getYear: function() { return this.date.getFullYear(); },
	getMonth : function() { return this.date.getMonth()+1; },
	getDate : function() { return this.date.getDate(); },
	getDay : function() { return this.date.getDay(); },
	isWeekend:function() { return (this.getDay() == 0 || this.getDay() == 6) ? true : false; },
	
	resetHours: function() {
		this.date.setHours(0,0,0,0);
		return this;
	},
	clone: function() {
		return new Blz.GData.Date(new Date(this.date));
	},
	
	asDate : function() {
		return new Date(this.date);
	},
	
	compare: function(d) {
		return (this.date - d.date);
	},
	
	toKeyString:function() {
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
		Blz.Widget.print("UKdate = " +  UKdate);
		Blz.Widget.print("USdate = " +  USdate);
		var UKtype = !+new Date('32/12/1969 Z') // zero time ?
		var UStype = !+new Date('12/32/1969 Z') // zero time ?
		Blz.Widget.print("UKtype = " +  UKtype);
		Blz.Widget.print("UStype = " +  UStype);
		m = (m < 10) ? "0" + m : "" + m;
		d = (d < 10) ? "0" + d : "" + d;
		
		return (UKdate) ?
			"" + d + "/" + m + "/" + y :
			"" + m + "/" + d+ "/" + y;
	}
}
