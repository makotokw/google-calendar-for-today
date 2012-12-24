/*!
 * Blz.Ajax
 * 
 * Bullseye is released under a permissive MIT license
 * Copyright (c) 2006-2010, makoto_kw (makoto.kw@gmail.com)
 */
Blz.Ajax = {
	get: function(url, callback, params, headers) {
		Ext.Ajax.request({
			method: 'GET',
			url: url,
			params: params,
			headers: headers,
			
			callback: function(options, success, response) {
				callback({
					success: success,
					data: response.responseText,
					response: response,
					options: options
				});
			}
		});
	},
	post: function(url, postData, callback, headers) {
		Ext.Ajax.request({
			method: 'POST',
			url: url,
			params: postData,
			headers: headers,
			callback: function(options, success, response) {
				callback({
					success: success,
					data: response.responseText,
					response: response,
					options: options
				});
			}
		});
	}
}
