'use strict';

var path = require('path');

var config = {};
var dist_dir = config.dist_dir = 'static/dist';
var src_dir = config.src_dir = 'static_src'; //只能用一级目录
var html_dir = 'templates/dist';

var project_root = path.dirname(__dirname);

config.path_root = "/Users/zuozhuo/Workspace/Codes/medweb/";

// html处理
config.html = [
        html_dir + '/**/*.html',
        '!' + html_dir + '/**/*.dist.html'
];

// css、sass、sprite处理
config.compass = {
    "src": [ src_dir + '/**/sass/' ],
    "http_path": "/", //可以改成CDN的域名，例如http://cdn.chunyu.me/static/
    "import_paths": [],
    "dist_base": dist_dir
};
config.sass = {

};
config.css_min = {
    "src": ['static/**/*.css', '!static/**/*.min.css'],
    "root": config.path_root
};
config.css_sprite = {
    "folder_root": [ src_dir + '/**/sass/sprite/']
};

// image处理
config.images = {
    "src": [ src_dir + '/**/img/**/*.*' , src_dir + '/**/*.sprite.png'],
    "dist_base": dist_dir
};

// 所有js源代码位置，用于jshint代码检查
config.js = [
    './gulpfile.js',
    './gulp_config.js',
        src_dir + '/**/*.js'
];

// 其他需要复制的文件，例如字体
config.copy_files = {
    "src": [ src_dir + '/**/font/*.*'],
    "dist_base": dist_dir
};

// 所有的app入口js文件，用于browserify打包js
config.browserify = {
    settings: {
        load_paths: [ path.join(project_root, src_dir)],
        transform: [
            //"browserify-shim",
            'cssify'
        ],
        exclude: [],
        external: []
    },
    vendors: {
        'vendor_pack_v1': {
            src: ['jquery', '_common/base/cy_base.js'],
            dist: dist_dir + "/base/vendor_pack_v1.js"
        }
    },
    apps: [
        {
            "vendor": "vendor_pack_v1",
            //"use_vendors":["",""]
            "src": [ src_dir + '/**/*.app.js' ],
            "dist_base": dist_dir
        }
    ]
};

// 所有umd包生成
// 模板参考：/node_modules/gulp-umd/templates/returnExports.js
config.umd = [
    {
        src: 'static/vendor/jquery.inview.js',
        dependencies: [
            {
                name: 'jquery',

                amd: 'jquery',
                cjs: 'jquery',
                global: 'jQuery',
                param: 'jQuery'
            }
        ],
        exports: '', // 库本身输出的变量，如jquery就用jQuery或$
        namespace: '___jquery_inview___' // 希望重新赋值给window的变量,请不要包含.
    },
    {
        src: 'static/vendor/modernizr.dev.js',
        dependencies: [   ],
        exports: 'window.Modernizr', // 库本身输出的变量，如jquery就用jQuery或$
        namespace: 'Modernizr' // 希望重新赋值给window的变量,请不要包含.
    }
];

module.exports = config;