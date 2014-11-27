'use strict';

var $ = require('jquery');
$.cy2=function(){
    console.log('22222-22222');
};
$.extend({
    cy: function () {
        $.post('/8888-8888', {a: 1});
    }
});
