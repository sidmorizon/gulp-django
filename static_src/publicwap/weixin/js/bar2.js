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