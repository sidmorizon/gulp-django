/**
 * Created by zuozhuo on 9/19/14.
 */

'use strict';

//载入相关配置------------------------------------------------------------------------------
var gulp_config = require('./_gulp_config/build_config.js');
var jshint_config = './_gulp_config/.jshintrc';


//基本库------------------------------------------------------------------------------
var gulp = require('gulp');
var gulp_plugins = require('gulp-load-plugins')();
var browserify = require('browserify');

//用于在子模块中使用 根路径require('static-assets/uniq/uniq.js')
//require('rootpath')(); //此包可以更改node的执行路径，改成browserify的paths配置
var path = require('path');

var through = require('through2');

var bourbon = require('node-bourbon');
var watchify = require('watchify');

//shell
//gulp.task('coveralls', ['coverage'], gulp_plugins.shell.task('cat coverage/lcov.info | coveralls'))
var watch_on = false;

//流处理------------------------------------------------------------------------------
//用于设置browserify打包后的输出文件名
var vinylSource = require('vinyl-source-stream');
//将vinyl的buffer流转换为持续流
//var streamify = require('gulp-streamify');
//var buffer = require('gulp-buffer');
var node_notifier = require('node-notifier');

// Standard handler
function standardErrorHandler(err) {
    var error_file_name, notifier = node_notifier;

    //发声
    gulp_plugins.util.beep();
    gulp_plugins.util.beep();
    gulp_plugins.util.beep();

    // Log to console
    gulp_plugins.util.log(gulp_plugins.util.colors.red('Error'), err.message);
    try {
        error_file_name = [];
        err.stream._streams.forEach(function (stream) {
            stream.entries.forEach(function (entry) {
                error_file_name.push(entry);
            });
        });
        gulp_plugins.util.log(gulp_plugins.util.colors.red('File'), error_file_name);

    } catch (ex) {

    }

    // Notification
    notifier.notify({title: 'Gulp build error:', message: 'Error: ' + err.message });
}
// Handler for browserify
function browserifyErrorHandler(err) {
    /*jshint validthis:true */
    standardErrorHandler(err);
    this.end();
}

function bundle_action(bundler, dest_file) {
    bundler.bundle()
        .on('error', browserifyErrorHandler)
        //通过 vinyl-source-stream 传入输入文件名
        .pipe(vinylSource(dest_file))
        .pipe(gulp.dest('./'));
        //.pipe(gulp_plugins.buffer());
        //.pipe(gulp_plugins.size({title:dest_file}));
    return bundler;
}
function do_bundle(bundle_pkg, browserify_cfg, src_add_method) {
    var bundler;
    src_add_method = src_add_method || 'add';//add | require
    var src_files = [].concat(bundle_pkg.src);
    var exclude_libs = [].concat(browserify_cfg.settings.exclude);
    var dest_file = bundle_pkg.dist;
    var full_map_path = dest_file + '.map';

    bundler = new browserify({
        debug: false,
        cache: {},
        packageCache: {},
        fullPaths: false,
        paths: gulp_config.browserify.settings.load_paths
        //,basedir:__dirname
    });

    if (watch_on) {
        // if watch is enable, wrap this bundle inside watchify
        bundler = watchify(bundler);
        bundler.on('update', function (ids) {

            console.log("browserify update:  " + ids);
            bundle_action(bundler, dest_file);
        });
        bundler.on('log', function (msg) {
            console.log("browserify log:  " + msg);
        });
    }

    src_files.forEach(function (file) {
        bundler[src_add_method](file);
    });

    browserify_cfg.settings.transform.forEach(function (ele) {
        bundler.transform(ele);
    });
    //1.exclude不打包jquery，运行时require('jquery')时，会报错Cannot find module 'jquery'；
    //b.exclude('jquery');
    //2.ignore不打包jquery话，运行时require('jquery')返回{}空对象，会报错 Object has no method 'ajax'
    if (bundle_pkg.vendor) {
        var the_vendor = browserify_cfg.vendors[bundle_pkg.vendor];
        if (the_vendor) {
            exclude_libs = exclude_libs.concat(the_vendor.src);
        }
    }
    exclude_libs.forEach(function (ele) {
        bundler.exclude(ele);
    });

    browserify_cfg.settings.external.forEach(function (ele) {
        bundler.external(ele);
    });


    // 开启压缩和source map     !gulp.env.production | process.env.NODE_ENV
    if (gulp.env.production) {
        console.log('Start minify for JS....');
        bundler.plugin('minifyify', {output: full_map_path, map: path.basename(full_map_path)});// 需要 b.bundle(bundle_callback)或opt.output
    }

    return bundle_action(bundler, dest_file);
}
function bundle_apps(option, browserify_cfg) {

    return through.obj(function (file, encoding, callback) {
//        console.log(file.path);
//        console.log(file.base + file.relative);
        var bundle_pkg = {
            vendor: option.vendor,
            src: file.path,
            dist: path.join(option.dist_base, file.relative)
        };
        do_bundle(bundle_pkg, browserify_cfg, 'add');
        callback(null, file);
    });
}
function bundle_vendors(browserify_cfg) {
    var vendor_name;
    for (vendor_name in browserify_cfg.vendors) {
        if (browserify_cfg.vendors.hasOwnProperty(vendor_name)) {
            do_bundle(browserify_cfg.vendors[vendor_name], browserify_cfg, 'require');
        }

    }
}

var gulp_tasks = {
    //使用minifyify来压缩和创建source map
    build_browserify: function () {

        var browserify_cfg = gulp_config.browserify;

        // 构建vendors
        if (browserify_cfg.vendors) {
            bundle_vendors(browserify_cfg);
        }

        // 构建apps
        browserify_cfg.apps.forEach(function (app) {
            gulp.src(app.src)
                .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))
                .pipe(bundle_apps(app, browserify_cfg));
            //.pipe(gulp_plugins.size({title:'build_browserify'}));
        });

    },
    build_html: function () {

        return gulp.src(gulp_config.html, {base: './'})
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.staticHash({asset: './'}))
            .pipe(gulp_plugins.rename(function (_path) {
                _path.extname = ".dist.html";
            }))
            .pipe(gulp.dest('./'))
            .pipe(gulp_plugins.size({title: 'build_html'}));

    },
    build_umd: function () {
        var umd = require('gulp-umd');
        gulp_config.umd.forEach(function (ele) {
            var src_path = ele.src;
            gulp.src(src_path)
                .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

                .pipe(umd({
                    dependencies: function () {
                        return ele.dependencies;
                    },
                    exports: function (file) {

                        return ele.exports;
                    },
                    namespace: function (file) {

                        return ele.namespace;
                    }
                }))
                .pipe(gulp_plugins.rename(function (_path) {
                    _path.extname = ".umd.js";
                }))
                .pipe(gulp.dest(path.dirname(src_path)))
                .pipe(gulp_plugins.size({title: src_path}));

        });
    },
    //编译sass到dist目录（包含bourbon插件）
    //css里使用image_url和font_url设置图片和字体相对路径
    build_compass: function () {
        var fs = require('fs'),
            path = require('path'),
            import_path = gulp_config.compass.import_paths;

        // 加入bourbon sass插件导入路径
        import_path = import_path.concat(bourbon.includePaths);

        function generate_sass(gulp_config) {
            return through.obj(function (file, encoding, callback) {

                var css_path, dist_path_root, project_path,
                    img_path, font_path, stats,
                    sass_path = file.path,
                    http_path = gulp_config.compass.http_path;

                stats = fs.statSync(sass_path);
                if (stats.isDirectory()) {
                    dist_path_root = path.dirname(
                        path.join(
                            __dirname,
                            gulp_config.compass.dist_base,
                            path.relative(path.join(__dirname, gulp_config.src_dir), sass_path)
                        )
                    );

                    css_path = path.join(dist_path_root, 'css');
                    img_path = path.join(dist_path_root, 'img');
                    font_path = path.join(dist_path_root, 'font');

                    project_path = path.join(__dirname);


                    sass_path = path.relative(__dirname, sass_path);
                    css_path = path.relative(__dirname, css_path);
                    img_path = path.relative(__dirname, img_path);
                    font_path = path.relative(__dirname, font_path);


                    // more config:
                    // https://github.com/appleboy/gulp-compass
                    gulp.src(path.join(sass_path, '/**/*.scss'))
                        .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))
                        .pipe(gulp_plugins.compass({
                            project: project_path,
                            sass: sass_path,
                            css: css_path,
                            image: img_path,
                            font: font_path,
                            import_path: import_path,
                            relative: false,
                            http_path: http_path,
                            style: gulp.env.production ? 'compressed' : 'expanded',
                            time: true
                        }));
                        //.pipe(gulp.dest('./')); //不要加这个，否则直接在根目录输出了，compass本身已经配置好输出目录
                }

                callback(null, file);
            });
        }

        return gulp.src(gulp_config.compass.src)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))
            .pipe(generate_sass(gulp_config));
    },
    //[Obsolete] 此方法已经过期，使用build_compass
    build_sass: function () {
        return gulp.src(gulp_config.sass.src)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.sass({
                outputStyle: gulp.env.production ? 'compressed' : 'expanded',
                includePaths: gulp_config.sass.includePaths.concat(bourbon.includePaths)
                //errLogToConsole: gulp.env.watch
            }))
            .pipe(gulp.dest(gulp_config.sass.dist_base))
            .pipe(gulp_plugins.size({title: 'build_sass'}));
    },
    //在当前目录压缩css，同时替换图片引用为绝对地址（root参数）
    build_css_min: function () {

        return gulp.src(gulp_config.css_min.src, {base: './'})
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.minifyCss({root: gulp_config.css_min.root})) //指定root参数，解决相对路径问题
            .pipe(gulp_plugins.rename(function (_path) {
                _path.extname = ".min.css";
            }))
            //.pipe(gulp_plugins.changed('./'))
            .pipe(gulp.dest('./'))
            .pipe(gulp_plugins.size({title: 'build_css_min'}));

    },
    //[Obsolete] sprite生成改用compass
    build_css_sprite: function () {

        var fs = require('fs'),
            path = require('path');

        function generate_sprite() {
            return through.obj(function (file, encoding, callback) {

                var dir, full_path,
                    _path = file.path,
                    dirs = fs.readdirSync(_path);
                while (!!(dir = dirs.pop())) {
                    full_path = path.join(_path, dir);
                    if (fs.statSync(full_path).isDirectory()) {
                        gulp.src(path.join(full_path, '*.*'))
                            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

                            .pipe(gulp_plugins.spritesmith({
                                imgName: dir + '.sprite.png',
                                cssName: '_' + dir + '.sprite.scss',
                                cssTemplate: './_gulp_config/spritesmith.scss.mustache'
                            }))
                            .pipe(gulp.dest(_path));
                    }
                }

                callback(null, file);
            });
        }

        gulp.src(gulp_config.css_sprite.folder_root)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(generate_sprite());
    },
    //压缩图片并复制到dist文件夹
    build_images: function () {
        return gulp.src(gulp_config.images.src)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.imagemin({
                optimizationLevel: 3,
                progressive: true, // jpg渐进图
                interlaced: true // gif渐进图
            }))
            .pipe(gulp_plugins.changed(gulp_config.images.dist_base, {hasChanged: gulp_plugins.changed.compareSha1Digest}))
            .pipe(gulp.dest(gulp_config.images.dist_base))
            .pipe(gulp_plugins.size({title: 'build_images'}));
    },
    //复制其他文件到dist文件夹
    copy_files: function () {
        return gulp.src(gulp_config.copy_files.src)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.changed(gulp_config.copy_files.dist_base, {hasChanged: gulp_plugins.changed.compareSha1Digest}))
            .pipe(gulp.dest(gulp_config.copy_files.dist_base))
            .pipe(gulp_plugins.size({title: 'copy_files'}));
    },
    //js代码检查
    lint_jshint: function () {
        var files = gulp_config.js;
        gulp.src(files)
            .pipe(gulp_plugins.plumber({errorHandler: standardErrorHandler}))

            .pipe(gulp_plugins.jshint(jshint_config))
            .pipe(gulp_plugins.jshint.reporter(require('jshint-stylish')));
    },
    //watch
    watch: function () {
        var watch_src_images_path,
            watch_src_sass_path,
            watch_src_js_path,
            watch_src_html_path,
            watch_dist_path,
            watch_opts,
            livereload_server = gulp_plugins.livereload();

        //1. 监控images
        watch_src_images_path = [].concat(gulp_config.images.src);

        //2. 监控scss
        watch_src_sass_path = [];
        gulp_config.compass.src.forEach(function (compass_path) {
            watch_src_sass_path = watch_src_sass_path.concat(path.join(compass_path, '/**/*.scss'));
        });

        //3. 监控js
        watch_src_js_path = [];
        gulp_config.browserify.apps.forEach(function (_app) {
            watch_src_js_path = watch_src_js_path.concat(_app.src);
        });

        //4. 监控html
        watch_src_html_path = [].concat(gulp_config.html);

        //5. 监控dist目录，用于livereload
        watch_dist_path = [
            path.join(gulp_config.dist_dir, "**/*.js"),
            path.join(gulp_config.dist_dir, "**/*.css")
        ];

        watch_opts = {
            interval: 1500,
            debounceDelay: 1500
        };

        gulp.watch(watch_src_images_path, watch_opts, ['build:images']);
        gulp.watch(watch_src_sass_path, watch_opts, ['build:compass']);
        //gulp.watch(js_path, watch_opts, [ 'build:browserify', 'build:html']);

        watch_on = true;
        gulp.run('build:browserify');

        gulp.watch(watch_dist_path, watch_opts, function (file) {
            livereload_server.changed(file.path);
        });


    }
};

gulp.task('lint:jshint', gulp_tasks.lint_jshint);
gulp.task('build:browserify', gulp_tasks.build_browserify);
gulp.task('build:html', gulp_tasks.build_html);
gulp.task('build:umd', gulp_tasks.build_umd);
gulp.task('build:sass', gulp_tasks.build_sass);
gulp.task('build:compass', gulp_tasks.build_compass);
gulp.task('build:css_min', gulp_tasks.build_css_min);
gulp.task('build:css_sprite', gulp_tasks.build_css_sprite);
gulp.task('build:images', gulp_tasks.build_images);
gulp.task('copy:files', gulp_tasks.copy_files);

gulp.task('watch',gulp_tasks.watch);

gulp.task('default', gulp_plugins.sync(gulp).sync([
    [
        'copy:files',
        //'build:css_sprite', //使用compass来做sprite图生成
        'build:images'
    ],

    'build:compass',
    //'build:sass', 'build:css_min', //使用compass来编译sass、压缩css和处理相对路径问题

    'lint:jshint',
    'build:browserify',

    'build:html'
]));

gulp.task('debug', function () {
    gulp.env.production = false;
    gulp.run('default');
});

gulp.task('production', function () {
    gulp.env.production = true;
    gulp.run('default');
});


