/**! 
 * Distributed Service-Unique IDs that are short and sweet.
 * 
 * http://download.github.io/suid
 * 
 * @Author Stijn de Witt
 * @Copyright (c) 2015. Some rights reserved. 
 * @License CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) 
 */
/* jshint browser:true, shadow:true, devel:true */

/** @namespace suid */
(function(){
	'use strict';
	
	var POOL = 'suidpool', 
		DETECT = 'suiddetect',
		
		/** 
		 * The alphabet used when serializing to base-32.
		 * 
		 * <big><code>'0123456789acdefghijkmnprstuvwxyz'</code></big>
		 * 
		 * @constant
		 * @memberof! suid
		 * @see {@link suid.Suid#toBase32}
		 * @see {@link suid.Suid#toString}
		 */
		ALPHABET = '0123456789acdefghijkmnprstuvwxyz',
		
		/** 
		 * The replacement symbols used during compression.
		 * 
		 * <big><code>[['b','00'], ['l','01'], ['o','02'], ['q','03']]</code></big>
		 * 
		 * @constant
		 * @memberof! suid 
		 * @see suid.Suid.compress
		 * @see suid.Suid.decompress
		 */
		REPLACEMENT_SYMBOLS = [['b','00'], ['l','01'], ['o','02'], ['q','03']],
		
		localStorageSupported = (function(ls){try{ls.setItem(DETECT, DETECT);ls.removeItem(DETECT);return true;}catch(e){return false;}})(localStorage),
		log = window.console && console.error,
		currentBlock,
		currentId,
		options = getOptions(),
		settings = {
			url: options.url,
			min: options.min || 2,
			max: options.max || 2
		};

	/** 
	 * <p>When called as a regular function, generates a new Suid. 
	 * Any arguments will be ignored.</p>
	 * 
	 * <p>When called as a constructor, constructs a new Suid based
	 * on the given value, which may be either a Number, or a 
	 * (possibly compressed) Base32 String using suid's 
	 * {@link suid.ALPHABET}.</p>
	 * 
	 * <p><b>Examples</b></p>
	 * 
	 * <big><pre>
	 * // call as regular function to get the next id
	 * var id = Suid();
	 * 
	 * // call as constructor to wrap a regular Number in a Suid
	 * var NUL = new Suid(0);
	 * 
	 * // call as constructor to wrap a (possibly compressed) base-32 string in a Suid
	 * var suid = new Suid('14ub');
	 * </pre></big>
	 * 
	 * @param value The Number or String value for the new Suid.
	 *              Only used when called as a constructor.
	 * 
	 * @class Suid
	 * @memberof suid 
	 */
	var Suid = (function() {
		
		function Suid(value) {
			if (this instanceof Suid) {
				// Constructor invocation
				Number.call(this, this.value = (typeof value === 'string' ? Suid.fromString(value) : value));
			} else {
				// Direct invocation
				return next();
			}
		}
		
		Suid.prototype = Object.create(Number.prototype);
		
		/** 
		 * Converts this suid to string.
		 * 
		 * @return The (possibly compressed) base-32 string.
		 * 
		 * @memberof! suid.Suid#
		 * @see suid.Suid#toBase32
		 * @see suid.Suid.compress
		 */
		Suid.prototype.toString = function Suid_toString() {
			return Suid.compress(this.toBase32());
		};
		
		/**
		 * Converts this suid to a base-32 string.
		 * 
		 * @return The uncompressed base-32 string.
		 *  
		 * @memberof! suid.Suid#
		 * @see suid.Suid#toString
		 * @see suid.Suid.compress
		 */
		Suid.prototype.toBase32 = function Suid_toBase32() {
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
			return result;
		};
		
		/**
		 * Returns the underlying value of this suid.
		 * 
		 * @return The underlying primitive Number value.
		 * 
		 * @memberof! suid.Suid#
		 */
		Suid.prototype.valueOf = function Suid_valueOf() {
			return this.value;
		};
		
		/**
		 * Creates a new suid from the given string.
		 * 
		 * @param str The (possibly compressed) base-32 string.
		 * @return The newly created suid.
		 * 
		 * @memberof! suid.Suid#
		 * @see suid.Suid.fromBase32
		 * @see suid.Suid.decompress
		 */
		Suid.fromString = function Suid_fromString(str) {
			return Suid.fromBase32(Suid.decompress(str));
		};
		
		/**
		 * Creates a new suid from the given string.
		 * 
		 * @param str The uncompressed base-32 string.
		 * @return The newly created suid.
		 * 
		 * @memberof! suid.Suid#
		 * @see suid.Suid.fromString
		 * @see suid.Suid.decompress
		 */
		Suid.fromBase32 = function Suid_fromBase32(str) {
			var result = 0;
			for (var i=0; i<str.length; i++) {
				var idx = ALPHABET.indexOf(str.charAt(i));
				result = result * 32 + idx;
			}
			return new Suid(result);
		};
		
		/**
		 * Compresses the given string.
		 * 
		 * @param str The uncompressed base-32 string.
		 * @return The compressed base-32 string.
		 * @memberof! suid.Suid
		 * @see suid.Suid.decompress
		 */
		Suid.compress = function Suid_compress(str) {
			for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
				str = str.replace(new RegExp(replacement[1], 'g'), replacement[0]);
			}
			return str;
		};
		
		/**
		 * Decompresses the given string.
		 * 
		 * @param str The compressed base-32 string.
		 * @return The uncompressed base-32 string.
		 * 
		 * @memberof! suid.Suid
		 * @see suid.Suid.decompress
		 */
		Suid.decompress = function Suid_decompress(str) {
			for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
				str = str.replace(new RegExp(replacement[0], 'g'), replacement[1]);
			}
			return str;
		};
		
		function next() {
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
		}
		
		return Suid;
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
		
		function handleSuccess(text) {
			retries = 0;
			started = 0;
			var pool = Pool.get();
			pool.push(JSON.parse(text));
			Pool.set(pool);
		}
		
		function handleError(status, request) {
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
					retries = 0;
					started = 0;
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
					this.status === 200 ? success(this.responseText, this) : error(this.status, this);
				}
			}); 
			xhr.addEventListener('error', function () { 
				error(this, this.status); 
			}); 
			xhr.send(); 
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

	function getOptions() {
		var options = {};
		var script = document.querySelector('script[data-suid-server]');
		if (! script) {
			if (log) {console.error('Attribute `data-suid-server` not found on any script element. Unable to fetch suids from the server.');}
			return options;
		}
		var url = script.getAttribute('data-suid-server'),
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
	
	// Fetch initial data from the server if needed
	Server.fetch();
	
	// EXPOSE
	window.Suid = Suid;
})();
