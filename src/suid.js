/**! 
 * Suid - Distributed Service-Unique IDs that are short and sweet.
 * 
 * https://github.com/download/suid
 * 
 * @Author Stijn de Witt
 * @Copyright (c) 2015 
 * @License CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) 
 */
/* jshint browser:true, shadow:true, devel:true */
(function(){
	'use strict';
	
	var POOL = 'suidpool', 
		DETECT = 'suiddetect', 
		ALPHABET = '0123456789acdefghijkmnprstuvwxyz',
		REPLACEMENT_SYMBOLS = [['b','00'], ['l','01'], ['o','02'], ['q','03']],
		log = window.console && console.error,
		currentBlock,
		currentId,
		options = getOptions(),
		settings = {
			url: options.url,
			min: options.min || 2,
			max: options.max || 2
		};
	
	var localStorageSupported = (function(){
		try {
			localStorage.setItem(DETECT, DETECT);
			var x = localStorage.getItem(DETECT);
			if (x !== DETECT) {return false;}
			localStorage.removeItem(DETECT);
			return true;
		} catch(e) {
			return false;
		}
	})();

	var Pool = (function(){
		var pool = [];
		return {
			get: function() {
				if (localStorageSupported) {
					pool = Pool.from(localStorage.getItem(POOL));
				}
				return pool;
			},
			set: function(values){
				pool = values;
				if (localStorageSupported) {
					localStorage.setItem(POOL, Pool.to(pool));
				}
				return Pool;
			},
			from: function(str){
				var results = [];
				if (str) {
					var strings = str.split(',');
					for (var i=0, s; s=strings[i]; i++) {
						results.push(new Suid(s));
					}
				}
				return results;
			},
			to: function(obj){
				return obj.join(',');
			}
		};
	})();
	
	var Server = (function(){
		var retries = 0,
			started = 0;
		
		function handleSuccess(responseText) {
			retries = 0;
			started = 0;
			var pool = Pool.get();
			pool.push(JSON.parse(responseText));
			Pool.set(pool);
		}
		
		function handleError(request, status) {
			// status code 5xx ? possibly recoverable.
			switch(status) {
				case 500: // Internal server error... hopefully a glitch? retry.
				case 502: // Bad Gateway... hopefully a glitch? retry.
				case 503: // Service unavailable... hopefully temporary? retry.
				case 504: // Gateway Timeout... hopefully temporary? retry.
					retry(request);
					break;
				default: // unrecoverable? give up
					if (log) {console.error('Unable to fetch suid data from server. ', request, status);}
			}
		}
		
		function retry(request) {
			if (retries === 0) {
				started = 0;
				if (log) {console.error('Giving up fetching suid data after 5 attempts to fetch from server url: ' + settings.url);}
				return;
			}
			
			retries--;
			var after = 300000; // 5 minutes
			var retryAfter = request.getResponseHeader('Retry-After');
			if (retryAfter) {
				after = parseInt(retryAfter, 10);
				if (! isNaN(after)) {
					after = after * 1000; // seconds to ms.
				}
			}
			// Is this urgent?
			if (! Pool.get().length) { // Pool is out of blocks
				if (after > 60000) {
					after = 60000; // 1 min
				}
			}
			if (currentId > 100) { // half of current block left
				if (after > 30000) {
					after = 30000; // 0.5 min
				}
			}
			if (! currentBlock) { // completely out
				if (after > 1000) {
					after = 1000; // 1 sec
				}
			}
			
			setTimeout(function(){
				ajax(settings.url, {blocks: settings.max - Pool.get().length}, handleSuccess, handleError);
			}, after);
		}
		
		return {
			fetch: function Server_fetch() {
				if (retries && ((new Date().getTime() - started < 5000) || 
								(currentId && (currentId < 100)))) {
					return; // already fetching and still recent or not urgent
				} 
				var pool = Pool.get();
				if (pool.length < settings.min) {
					retries = 3;
					started = Date.now();
					ajax(settings.url, {blocks: settings.max - pool.length}, handleSuccess, handleError);
				}
			}
		};
	})();

	function Suid(value) {
		if (this instanceof Suid) {
			if (typeof value === 'string') {
				for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
					value = value.replace(new RegExp(replacement[0], 'g'), replacement[1]);
				}
				var tmp = 0;
				for (var i=0; i<value.length; i++) {
					var idx = ALPHABET.indexOf(value.charAt(i));
					tmp = tmp * 32 + idx;
				}
				value = tmp;
			}
			this.value = value;
			Number.call(this, this.value);
		}
		else {
			return Suid.next();
		}
	}
	
	Suid.prototype = Object.create(Number.prototype);
	
	Suid.prototype.toString = function Suid_toString() {
		var value = this.valueOf();
		var result='', tmp='';
		for (var i=0; i<11; i++) {
			var idx = value & 0x1f;
			if (! idx) {
				tmp += '0';
			} else {
				result = ALPHABET.charAt(idx) + tmp + result;
				tmp = '';
			}
			value = value / 32;
		}
		for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
			result = result.replace(new RegExp(replacement[1], 'g'), replacement[0]);
		}
		return result;
	};
	
	Suid.prototype.valueOf = function Suid_valueOf() {
		return this.value;
	};
	
	Suid.next = function Suid_next() {
		if (! currentBlock) {
			Server.fetch();
			var pool = Pool.get();
			if (pool.length === 0) {
				throw new Error('Unable to generate IDs. Suid block pool exhausted.');
			}
			currentId = 0;
			currentBlock = pool.splice(0, 1)[0];
			Pool.set(pool);
		}
		
		var result = currentBlock + currentId * 4;
		currentId++;
		if (currentId > 255) {
			currentBlock = null;
		}
		return new Suid(result);
	};
	
	function getOptions() {
		var options = {};
		var script = document.querySelector('script[data-suid-url]');
		if (! script) {
			if (log) {console.error('Attribute `data-suid-url` not found on any script element. Unable to fetch suids from the server.');}
			return options;
		}
		var url = script.getAttribute('data-suid-url'),
			attr = script.getAttribute('data-suid-options');
		
		if (attr) {
			try {
				options = JSON.parse(attr.split('\'').join('"'));
			}
			catch(error) {
				if (log) {console.error('Unable to parse suid options as JSON: \'' + attr + '\'. Error was: ', error);}
			}
		}
		options.url = url;
		return options;
	}
	

	function ajax(url, data, success, error, sync) {
		var xhr = new XMLHttpRequest(), query = [], params, key; 
		for (key in data) {
			if (data.hasOwnProperty(key)) {
				query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
		}
		params = query.join('&');
		xhr.open('get', url + (params ? (url.indexOf('?') !== -1 ? '&' : '?') + params : ''), !sync); 
		xhr.addEventListener('readystatechange', function(){ 
			if (this.readyState === 4) { 
				this.status === 200 ? success(this.responseText) : error(this, this.status);
			}
		}); 
		xhr.addEventListener('error', function () { 
			error(this, this.status); 
		}); 
		xhr.send(); 
	}

	// Fetch initial data from the server if needed
	Server.fetch();
	
	// EXPOSE
	window.Suid = Suid;
})();
