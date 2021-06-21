/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Error window entry file
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Main entry point for the paste images modal
 *
 * END HEADER
 */

import Vue from 'vue'
import App from './App.vue'
import windowRegister from '../common/modules/window-register'

const ipcRenderer = (window as any).ipc as Electron.IpcRenderer

// The first thing we have to do is run the window controller
windowRegister()

// Create the Vue app because we need to reference it in our toolbar controls
const app = new Vue(App)

// This window will be closed immediately on a window-close command
ipcRenderer.on('shortcut', (event, shortcut) => {
  if (shortcut === 'close-window') {
    ipcRenderer.send('window-controls', { command: 'win-close' })
    // TODO: Probably it's nice to see if there are any unsaved changes before?
  }
})

// In the end: mount the app onto the DOM
app.$mount('#app')
