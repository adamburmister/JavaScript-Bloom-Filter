// Bloom Filter in JavaScript
// 2010-11-22 Adam Burmister, Mojolly.com
// license: GPL
// original perl version: http://search.cpan.org/~mceglows/Bloom-Filter-1.0/Filter.pm
// original js version: http://la.ma.la/misc/js/bloomfilter/bloomfilter.js
// 2007-09-14 ma.la

function BloomFilter(){
	this.init()
	return this;
}

BloomFilter.prototype = {
  var errorRate = 0, capacity = 0, filterLength = 0, keyCount = 0;
	var filter = [];
	var hashFunc = function(a){ return a; }; // The hash function
  
  /**
   * @param capacity {Float} The anticipated number of items to be added to the filter. More than this number of items can be added, but the error rate will exceed what is expected
   * @param errorRate {Float} The accepable false-positive rate (e.g., 0.01F = 1%)
   * @param hashFunc {Function} The function to hash the input values
   */
	init: function(capacity, errorRate, hashFunc){
	  this.capacity  = capacity  || 100;
	  this.errorRate = errorRate || 0.001;
	  this.hashFunc  = hashFunc  || Hash.SHA1.hash;
	  
		var ret = this._calcShortestFilterLength(this.capacity, this.errorRate);
		this.filterLength = ret[0];
		this.numHashFuncs = ret[1];
		
		this.filter = this._makeEmptyFilter(this.filterLength);
	},
	
	add: function(keys){
		var keys = (keys instanceof Array) ? keys : [keys];
		for(var i=0;i<keys.length; i++){
			if(this.keyCount > this.capacity) {
				return; // error: Over capacity
			}
			var cells = this._getCells( keys[i] );
			for(var j=0; j<cells.length; j++) {
				this.filter[ cells[j] ] = true;
			}
			this.keyCount++;
		}
		return this;
	},
	
	check: function(keys){
		if(!keys) return false;
		var result = [];
		for(var i=0;i<keys.length;i++){
			var match = 0;
			var cells = this._getCells( keys[i] );
			for(var j = 0; j < cells.length; j++){
				var cell = cells[j];
				match = this._isBitOn(cell);
				if (!match) break;
			}
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
	
	_getCells: function(key){
		var salts = this.salts;
		var cells = [];
		for(var i=0; i < salts.length; i++){
			var salt = salts[i];
			var hash = this.hashFunc(key, salt);
			var vec = 0;
			// var pieces = [];
			for(var j=0; j<40; j+=8){
				var c = parseInt(hash.slice(j, j + 8), 16);
				// pieces.push(c);
				vec = vec ^ c;
			}
			var result = vec;
			// console.log(result);
			var bit_offset = Math.abs(result  % this.filterLength);
			cells.push(bit_offset)
		}
		return cells;
	},
	
	_isBitOn: function(offset){
		return this.filter[offset] === true;
	},
	
	_makeEmptyFilter: function(size){
		var f = new Array(size);
		var i = size;
		while(i--) {
		  f[i] = false;
		}
		return f;
	}
};