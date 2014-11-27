/**
 * Created by zuozhuo on 9/19/14.
 */
'use strict';
//require('rootpath')();
//引用项目目录下的static-assets/uniq/uniq.js
var uniq = require('uniq');
var $ = require('jquery');


$.ajax();

var arr = [1, 3, 5, 6, 77, 3, 5, 2, 1, 4, 6];
console.log(arr);
console.log(uniq(arr));

