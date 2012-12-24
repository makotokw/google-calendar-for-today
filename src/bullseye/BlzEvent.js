/*!
 * Blz.Notifier
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.Notifier = {
	observers:[],
	notifyMethodPrefix:'',
	suppressNotifications:0,
	addObserver: function(observer) {
		if (!observer) return;
		// Make sure the observer isn't already on the list.
		for (var i = 0, len = this.observers.length; i < len; i++) {
			if (this.observers[i] == observer) return;
		}
		this.observers[len] = observer;
	},
	removeObserver: function(observer) {
		if (!observer) return;
		for (var i = 0, len = this.observers.length; i < len; i++) {
			if (this.observers[i] == observer) {
				this.observers.splice(i, 1);
				break;
			}
		}
	},
	notifyObservers: function(methodName, data) {
		if (!methodName) return;
		methodName = this.notifyMethodPrefix+methodName;
		if (!this.suppressNotifications) {
			for (var i = 0, len = this.observers.length; i < len; i++) {
				var obs = this.observers[i];
				if (obs) {
					if (typeof obs == "function") obs(methodName, this, data);
					else if (obs[methodName]) obs[methodName](this, data);
				}
			}
		}
	},
	enableNotifications: function() {
		if (--this.suppressNotifications < 0) {
			this.suppressNotifications = 0;
		}
	},
	disableNotifications: function() {
		++this.suppressNotifications;
	}
}