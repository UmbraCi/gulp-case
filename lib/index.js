const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')

const browserSync = require('browser-sync')
const bs = browserSync.create()

// 自动加载所有gulp前缀的插件
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

const cwd = process.cwd()
let config = {
  //default
  build:{
    src:'src',
    dist:'dist',
    temp:'temp',
    public:'public',
    //这里可以把下面的url都做成可配置项
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({},config,loadConfig)
} catch (error) {

}

const clean = () => {
  return del(['dist', 'temp'])
}

const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src('src/assets/scripts/*.js')
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
  // .pipe(babel())
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data:config.data }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/font/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style),
  watch('src/assets/scripts/*.js', script),
  watch('src/*.html', page),
  // watch('src/assets/images/**',image),
  // watch('src/assets/font/**',font),
  // watch('public/**',extra),

  watch([
    'src/assets/images/**',
    'src/assets/font/**',
    'public/**'
  ], bs.reload)

  bs.init({
    notify: false,
    // files:'dist/**',
    server: {
      baseDir: ['temp', 'src', 'public'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('temp/*.html', { base: 'temp' })
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true })))
    .pipe(dest('dist'))
}

const compile = parallel(style, script, page)

const build = series(clean, parallel(series(compile, useref), extra, image, font))

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
