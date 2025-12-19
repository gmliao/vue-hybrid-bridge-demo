import Vue from 'vue'
import VueI18n from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

Vue.use(VueI18n)

const savedLocale = localStorage.getItem('locale') || 'en'

const i18n = new VueI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
})

export default i18n

