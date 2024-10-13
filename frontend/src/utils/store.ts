// import { createStore, Store } from '@tauri-apps/plugin-store'


export async function initStore() {
    return {}
}

export function getStore() {
    return {
        get: (s: string) => {
            console.log(s)
        }
    }
}
