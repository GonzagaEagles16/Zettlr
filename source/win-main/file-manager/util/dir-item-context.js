const { trans } = require('../../../common/i18n')
const { ipcRenderer, shell } = require('electron')

const TEMPLATE = [
  {
    label: 'menu.rename_dir',
    command: 'dir-rename'
  },
  {
    label: 'menu.delete_dir',
    command: 'dir-delete'
  },
  {
    label: 'gui.attachments_open_dir',
    command: 'dir-open-externally'
  },
  {
    type: 'separator'
  },
  {
    label: 'menu.new_file',
    command: 'file-new'
  },
  {
    label: 'menu.new_dir',
    command: 'dir-new'
  },
  {
    label: 'menu.set_icon',
    command: 'select-icon'
  },
  {
    type: 'separator'
  }
]

const NOT_FOUND_TEMPLATE = [
  {
    id: 'menu.rescan_dir',
    label: 'menu.rescan_dir',
    enabled: true
  }
]

module.exports = function displayFileContext (event, dirObject, el, callback) {
  let items = []

  // Determine the template to use
  let template = TEMPLATE
  if (dirObject.dirNotFoundFlag === true) {
    template = NOT_FOUND_TEMPLATE
  }

  for (const item of template) {
    const buildItem = {}

    buildItem.id = item.label
    if (item.label !== undefined) {
      buildItem.label = trans(item.label)
    }

    if (item.accelerator !== undefined) {
      buildItem.accelerator = item.accelerator
    }

    buildItem.command = item.command
    buildItem.type = item.type
    buildItem.enabled = true

    items.push(buildItem)
  }

  // Now check for a project
  if (dirObject.project === null && dirObject.dirNotFoundFlag !== true) {
    items.push({
      id: 'menu.new_project',
      label: trans('menu.new_project'),
      enabled: true
    })
  } else if (dirObject.dirNotFoundFlag !== true) {
    items = items.concat([{
      id: 'menu.remove_project',
      label: trans('menu.remove_project'),
      enabled: true
    },
    {
      id: 'menu.project_properties',
      label: trans('menu.project_properties'),
      enabled: true
    },
    {
      id: 'menu.project_build',
      label: trans('menu.project_build'),
      enabled: true
    }])
  }

  // Finally, check for it being root
  if (dirObject.parent == null) {
    items = items.concat([
      {
        type: 'separator'
      },
      {
        id: 'menu.close_workspace',
        label: trans('menu.close_workspace'),
        enabled: true
      }
    ])
  }

  const point = { x: event.clientX, y: event.clientY }
  global.menuProvider.show(point, items, (clickedID) => {
    callback(clickedID) // TODO
    switch (clickedID) {
      case 'menu.delete_dir':
        ipcRenderer.send('message', {
          command: 'dir-delete',
          content: { hash: dirObject.hash }
        })
        break
      case 'gui.attachments_open_dir':
        shell.showItemInFolder(dirObject.path)
        break
      case 'menu.set_icon':
        displayIconPopup(dirObject, el)
        break
      case 'menu.remove_project':
        ipcRenderer.send('message', {
          command: 'dir-remove-project',
          content: { hash: dirObject.hash }
        })
        break
      case 'menu.new_project':
        ipcRenderer.send('message', {
          command: 'dir-new-project',
          content: { hash: dirObject.hash }
        })
        break
      case 'menu.project_properties':
        ipcRenderer.send('message', {
          command: 'dir-project-properties',
          content: { hash: dirObject.hash }
        })
        break
      case 'menu.project_build':
        ipcRenderer.send('message', {
          command: 'dir-project-export',
          content: { hash: dirObject.hash }
        })
        break
      case 'menu.close_workspace':
        ipcRenderer.send('message', {
          command: 'root-close',
          content: dirObject.hash
        })
        break
      case 'menu.rescan_dir':
        ipcRenderer.send('message', {
          command: 'rescan-dir',
          content: dirObject.hash
        })
    }
  })
}

function displayIconPopup (dirObject, element) {
  // Display the popup
  global.popupProvider.show('icon-selector', element)

  // Listen to clicks
  const popup = document.getElementById('icon-selector-popup')
  popup.addEventListener('click', (event) => {
    let target = event.target

    if (target.tagName === 'CLR-ICON') {
      target = target.parentElement
    }

    if (target.classList.contains('icon-block') === false) {
      return
    }

    const icon = target.dataset.shape
    global.ipc.send('dir-set-icon', {
      'hash': dirObject.hash,
      'icon': (icon === '__reset') ? null : icon
    })

    // Close & dereference
    global.popupProvider.close()
  })
}
