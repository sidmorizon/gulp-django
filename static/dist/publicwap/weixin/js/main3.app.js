(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (__filename){
/**
 * Created by zuozhuo on 9/22/14.
 */
'use strict';

var $ = require('jquery');
require('_common/base/cy_base.js');


console.log('hi，我是'+__filename);
console.log('jquery: ');
console.log($);

module.exports = {
  do_ajax : function(){
      $.post('/wo_shi_fake_de_ajax/'+new Date().getTime());
  }
};
}).call(this,"/static_src/publicwap/weixin/js/bar2.js")
},{"_common/base/cy_base.js":undefined,"jquery":undefined}],2:[function(require,module,exports){
/**
 * Created by zuozhuo on 10/16/14.
 */
'use strict';
var bar2 = require('./bar2.js');
console.log('this is main3.js!!!!!!!!!');
},{"./bar2.js":1}]},{},[2]);
