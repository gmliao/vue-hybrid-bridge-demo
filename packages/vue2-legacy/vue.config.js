const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    headers: {
      // 允許被 iframe 嵌入
      'X-Frame-Options': 'ALLOWALL'
    }
  },
  // 允許跨域存取
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'Vue2 Legacy App'
      return args
    })
  }
})

