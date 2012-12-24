/*!
 * Blz.Version
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.Version = function(major, minor, revision, buildNumber) {
	this.major = (major != null) ? major : 0;
	this.minor = (minor != null) ? minor : 0;
	this.revision = (revision != null) ? revision : 0;
	this.buildNumber = (buildNumber != null) ? buildNumber : 0;
};
Blz.Version.prototype = {
	parse : function(versionText) {
		var vars = versionText.split(".");
		switch (vars.length) {
			case 4 :
				this.buildNumber = vars[3]; // no break
			case 3 :
				this.revision = vars[2]; // no break
			case 2 :
				this.minor = vars[1]; // no break
			case 1 :
				this.major = vars[0];
				break;
		}
	},

	toString : function() {
		// "1.0.0.0";
		return [this.major,this.minor,this.revision,this.buildNumber].join('.');
	},

	compare : function(version) {
		if (this.major == version.major && this.minor == version.minor
				&& this.revision == version.revision
				&& this.buildNumber == version.buildNumber)
			return 0;

		if ((this.major < version.major)
				|| (this.major == version.major && this.minor < version.minor)
				|| (this.major == version.major && this.minor == version.minor && this.revision < version.revision)
				|| (this.major == version.major && this.minor == version.minor
						&& this.revision == version.revision && this.buildNumber < version.buildNumber))
			return -1;

		return 1;
	}
};