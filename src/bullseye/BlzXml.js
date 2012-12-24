/*!
 * Blz
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 * Blz.XML.SimpleElement: Based on "XML.ObjTree" by Yusuke Kawasaki. http://www.kawa.net/
 */
Blz.XML = {};
Blz.XML.Parser = {
	string2object : function(xmlstr) {
		var p = new Blz.XML.SimpleElement();
		return p.parse(xmlstr);
	},
	file2object : function(pathName) {
		var xmlstr = filesystem.readFile(pathName); // TODO: replace filesystem
		return this.string2object(xmlstr);
	}
};

// constructor
Blz.XML.SimpleElement = function(xmlstr) {
	this.initialize(xmlstr);
}
Blz.XML.SimpleElement.prototype = {
	initialize : function(xmlstr) {
		this.attr_prefix = '-';
		this.isarray = true;
		if (xmlstr) {
			this.parse(xmlstr);
		}
	},
	parse : function(xmlstr) {
		var root, xmldom;
		if (typeof(window) != "undefined" && window.DOMParser) {
			this.attr_prefix = ''; // clear for Firefox
			xmldom = new DOMParser();
			// xmldom.async = false; // DOMParser is always sync-mode
			var dom = xmldom.parseFromString(xmlstr, "application/xml");
			if (!dom) return;
			root = dom.documentElement;
		} else if (typeof(window) != "undefined" && window.ActiveXObject) {
			xmldom = new ActiveXObject('Microsoft.XMLDOM');
			xmldom.async = false;
			xmldom.loadXML(xmlstr);
			root = xmldom.documentElement;
		} else if (typeof(XMLDOM) != "undefined" && XMLDOM) { // for Yahoo Widget
			this.attr_prefix = ''; // clear
			xmldom = XMLDOM.parse(xmlstr);
			root = xmldom.documentElement;
			this.isarray = false;
		}
		if (!root) return;
		return this.parseDOM(root);
	},

	parseDOM : function(root) {
		if (!root) return;
		this.__force_array = {};
		if (this.force_array) {
			for (var i = 0; i < this.force_array.length; i++) {
				this.__force_array[this.force_array[i]] = 1;
			}
		}
		var json = this.parseElement(root); // parse root node
		if (this.__force_array[root.nodeName]) {
			json = [json];
		}
		return json;
	},

	parseElement : function(elem) {
		// COMMENT_NODE
		if (elem.nodeType == 7)
			return;
		// TEXT_NODE CDATA_SECTION_NODE
		if (elem.nodeType == 3 || elem.nodeType == 4) {
			var bool = elem.nodeValue.match(/[^\x00-\x20]/);
			if (bool == null)
				return; // ignore white spaces
			return elem.nodeValue;
		}

		var retval;
		var cnt = {};

		// parse attributes
		if (elem.attributes && elem.attributes.length) {
			retval = {};
			for (var i = 0; i < elem.attributes.length; i++) {
				var key = (this.isarray) ? elem.attributes[i].nodeName : elem.attributes.item(i).nodeName;
				if (typeof(key) != "string")
					continue;
				var val = (this.isarray) ? elem.attributes[i].nodeValue : elem.attributes.item(i).nodeValue;
				if (!val)
					continue;
				key = this.attr_prefix + key;
				if (typeof(cnt[key]) == "undefined")
					cnt[key] = 0;
				cnt[key]++;
				this.addNode(retval, key, cnt[key], val);
			}
		}

		// parse child nodes (recursive)
		if (elem.childNodes && elem.childNodes.length) {
			var textonly = true;
			if (retval)
				textonly = false; // some attributes exists
			for (var i = 0; i < elem.childNodes.length && textonly; i++) {
				var ntype = (this.isarray) ? elem.childNodes[i].nodeType : elem.childNodes.item(i).nodeType;
				if (ntype == 3 || ntype == 4)
					continue;
				textonly = false;
			}
			if (textonly) {
				if (!retval)
					retval = "";
				for (var i = 0; i < elem.childNodes.length; i++) {
					retval += (this.isarray) ? elem.childNodes[i].nodeValue : elem.childNodes.item(i).nodeValue;
				}
			} else {
				if (!retval)
					retval = {};
				for (var i = 0; i < elem.childNodes.length; i++) {
					var key = (this.isarray) ? elem.childNodes[i].nodeName : elem.childNodes.item(i).nodeName;
					if (typeof(key) != "string")
						continue;
					var val = (this.isarray) ? this.parseElement(elem.childNodes[i]) : this.parseElement(elem.childNodes.item(i));
					if (!val)
						continue;
					if (typeof(cnt[key]) == "undefined")
						cnt[key] = 0;
					cnt[key]++;
					this.addNode(retval, key, cnt[key], val);
				}
			}
		}
		return retval;
	},

	addNode : function(hash, key, cnts, val) {
		if (this.__force_array[key]) {
			if (cnts == 1)
				hash[key] = [];
			hash[key][hash[key].length] = val; // push
		} else if (cnts == 1) { // 1st sibling
			hash[key] = val;
		} else if (cnts == 2) { // 2nd sibling
			hash[key] = [hash[key], val];
		} else { // 3rd sibling and more
			hash[key][hash[key].length] = val;
		}
	},

	scalar2xml : function(name, text) {
		if (name == "#text")
			return this.escape(text);
		else
			return "<" + name + ">" + this.escape(text) + "</" + name + ">\n";
	},

	array2xml : function(name, array) {
		var out = [];
		for (var i = 0; i < array.length; i++) {
			var val = array[i];
			if (typeof(val) == "undefined" || val == null) {
				out[out.length] = "<" + name + " />";
			} else if (typeof(val) == "object" && val.constructor == Array) {
				out[out.length] = this.array2xml(name, val);
			} else if (typeof(val) == "object") {
				out[out.length] = this.hash2xml(name, val);
			} else {
				out[out.length] = this.scalar2xml(name, val);
			}
		}
		return out.join("");
	},

	hash2xml : function(name, tree) {
		var elem = [];
		var attr = [];
		for (var key in tree) {
			if (!tree.hasOwnProperty(key))
				continue;
			var val = tree[key];
			if (key.charAt(0) != this.attr_prefix) {
				if (typeof(val) == "undefined" || val == null) {
					elem[elem.length] = "<" + key + " />";
				} else if (typeof(val) == "object" && val.constructor == Array) {
					elem[elem.length] = this.array2xml(key, val);
				} else if (typeof(val) == "object") {
					elem[elem.length] = this.hash2xml(key, val);
				} else {
					elem[elem.length] = this.scalar2xml(key, val);
				}
			} else {
				attr[attr.length] = " " + (key.substring(1)) + '="'
						+ (this.xml_escape(val)) + '"';
			}
		}
		var jattr = attr.join("");
		var jelem = elem.join("");
		if (typeof(name) == "undefined" || name == null) {
			// no tag
		} else if (elem.length > 0) {
			if (jelem.match(/\n/)) {
				jelem = "<" + name + jattr + ">\n" + jelem + "</" + name
						+ ">\n";
			} else {
				jelem = "<" + name + jattr + ">" + jelem + "</" + name + ">\n";
			}
		} else {
			jelem = "<" + name + jattr + " />\n";
		}
		return jelem;
	},

	escape : function(text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
				.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
};