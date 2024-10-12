import { createStore, Store } from '@tauri-apps/plugin-store'

let storeInstance: Store | null = null

export async function initStore() {
  if (!storeInstance) {
    storeInstance = await createStore('store.bin', {
      // @ts-ignore
      autoSave: 100,
    })
    // Unhandled Promise Rejection: invalid args `autoSave` for command `create_store`: invalid type: boolean `true`, expected u64
  }
  return storeInstance
}

export function getStore() {
  if (!storeInstance) {
    throw new Error('Store not initialized. Call initStore() first.')
  }
  return storeInstance
}
