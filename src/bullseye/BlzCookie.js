/*!
 * Blz.Widget.Cookie
 *
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.Cookie = {
	userDataForIE: false,
	isIE: Ext.isIE, 
	initialize: function(userDataForIE) {
		this.cookieShelfLife = 365;
		this.userDataForIE = userDataForIE;
		if (Ext.isIE && this.userDataForIE) {
			this.IE_CACHE_NAME = "storage";
			if ($(this.IE_CACHE_NAME) == null) {
				var div = document.createElement("DIV");
				div.id = this.IE_CACHE_NAME;
				document.body.appendChild(div);
			}
			this.store = $(this.IE_CACHE_NAME);
			this.store.style.behavior = "url('#default#userData')";
		}
	},
	
	getCookie: function(aCookieName) {
		var result = null;
		if (Ext.isIE && this.userDataForIE) {
			this.store.load(this.IE_CACHE_NAME);
			result = this.store.getAttribute(aCookieName);
		} else {
			for (var i = 0; i < document.cookie.split('; ').length; i++) {
				var crumb = document.cookie.split('; ')[i].split('=');
				if (crumb[0] == aCookieName && crumb[1] != null) {
					result = crumb[1];
					break;
				}
			}
		}
		if (Ext.isOpera.isBrowserOpera && result != null) {
			result = result.replace(/%22/g, '"');
		}
		return result;
	},
	
	setCookie: function(aCookieName, aCookieValue, aCookieDomain) {
		if (Ext.isIE && this.userDataForIE) {
			this.store.setAttribute(aCookieName, aCookieValue);
			this.store.save(this.IE_CACHE_NAME);
		} else {
			if (Ext.isOpera) {
				aCookieValue = aCookieValue.replace(/"/g, "%22");
			}
			var date = new Date();
			date.setTime(date.getTime() + (this.cookieShelfLife * 24*60*60*1000));
			var expires = '; expires=' + date.toGMTString();
			var domain = (aCookieDomain) ? "; domain=" + aCookieDomain : "";
			document.cookie = aCookieName + '=' + aCookieValue + domain + expires + '; path=/';
		}
	},
	
	clearCookie: function(aCookieName) {
		if (Ext.isIE && this.userDataForIE) {
			this.store.load(this.IE_CACHE_NAME);
			this.store.removeAttribute(aCookieName);
			this.store.save(this.IE_CACHE_NAME);
		} else {
			document.cookie = aCookieName + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/';
		}
	}
};
