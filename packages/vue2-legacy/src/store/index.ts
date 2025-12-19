import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export interface User {
  id: number
  name: string
  email: string
  token?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export interface RootState {
  auth: AuthState
}

export default new Vuex.Store<RootState>({
  modules: {
    auth: {
      namespaced: true,
      state: (): AuthState => ({
        user: null,
        isAuthenticated: false
      }),
      getters: {
        user: (state): User | null => state.user,
        isAuthenticated: (state): boolean => state.isAuthenticated,
        userName: (state): string => state.user?.name || ''
      },
      mutations: {
        setUser(state, user: User) {
          state.user = user
        },
        setAuthenticated(state, value: boolean) {
          state.isAuthenticated = value
        },
        clearAuth(state) {
          state.user = null
          state.isAuthenticated = false
        }
      },
      actions: {
        logout({ commit }) {
          commit('clearAuth')
        }
      }
    }
  }
})

