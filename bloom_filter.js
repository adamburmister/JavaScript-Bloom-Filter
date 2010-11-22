// Bloom Filter in JavaScript
// 2010-11-22 Adam Burmister, Mojolly.com
// license: GPL
// original perl version: http://search.cpan.org/~mceglows/Bloom-Filter-1.0/Filter.pm
// original js version: http://la.ma.la/misc/js/bloomfilter/bloomfilter.js
// 2007-09-14 ma.la

function BloomFilter(capacity, errorRate, hasFunc){
	this.init(capacity, errorRate, hasFunc)
	return this;
}

BloomFilter.prototype = {
  errorRate: 0, 
  capacity: 0, 
  filterLength: 0, 
  keyCount: 0,
	filter: [],
	hashFunc: function(a){ return a; }, // The hash function
  
  /**
   * @param capacity {Float} The anticipated number of items to be added to the filter. More than this number of items can be added, but the error rate will exceed what is expected
   * @param errorRate {Float} The accepable false-positive rate (e.g., 0.01F = 1%)
   * @param hashFunc {Function} The function to hash the input values
   */
	init: function(capacity, errorRate, hashFunc){
	  this.capacity  = capacity  || 100;
	  this.errorRate = errorRate || 0.001;
	  this.hashFunc  = hashFunc  || hex_sha1;
	  
		var ret = this._calcShortestFilterLength(this.capacity, this.errorRate);
		this.filterLength = ret[0];
		this.numHashFuncs = ret[1];
		
		this.filter = new Array(this.filterLength);
	},
	
	/**
	 * @param keys {Array[string]|string} Value to add to the Bloom Filter
	 */
	add: function(keys){
		var keys = (keys instanceof Array) ? keys : [keys];
		for(var i=0;i<keys.length; i++){
			if(this.keyCount > this.capacity) {
			  throw "Bloom Filter capacity limit reached (" + this.capacity + ")";
			}
			this.filter[ this._computeHash(keys[i]) ] = true;
			this.keyCount++;
		}
		return this;
	},
	
	/**
	 * @param keys {Array[string]|string} Does this value exist in the current Bloom Filter
	 */
	has: function(keys){
	  var keys = (keys instanceof Array) ? keys : [keys]; 
		if(!keys) return false;
		var result = [];
		for(var i=0;i<keys.length;i++){
			var match = (this.filter[ this._computeHash( keys[i] ) ] === true);
			if (!match) break;
			result.push(match);
		}
		return keys.length == 1 ? !!result[0] : result;
	},
	
	_calcShortestFilterLength: function(num_keys, errorRate){
		var lowest_m;
		var best_k = 1;
		for(var k=1;k<=100;k++){
			var m = (-1 * k * num_keys) / ( Math.log( 1 - Math.pow(errorRate, (1/k)) ));
			if (lowest_m == null || (m < lowest_m) ) {
				lowest_m = m;
				best_k   = k;
			}
		}
		lowest_m = Math.floor(lowest_m) + 1;
		return [lowest_m, best_k];
	},
	
	/**
	 * Compute the hash value for a given key using the hashFunc
	 * @param {string} key
	 */
	_computeHash: function(key){
		var hash = this.hashFunc(key);
		var vec = 0;

		for(var j=0; j<40; j+=8){
			var c = parseInt(hash.slice(j, j + 8), 16);
			vec = vec ^ c;
		}

		return Math.abs(vec % this.filterLength);
	}
};