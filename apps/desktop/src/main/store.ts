import Store from 'electron-store'

interface StoreSchema {
  accessToken: string | null
  licenseKey: string | null
  user: {
    id: string
    username: string
    avatar?: string
  } | null
}

const store = new Store<StoreSchema>({
  defaults: {
    accessToken: null,
    licenseKey: null,
    user: null,
  },
})

export default store

