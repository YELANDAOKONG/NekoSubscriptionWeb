export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable
    || target.closest("input, textarea, select, [contenteditable=true]") !== null
  )
}

export function isOverlayTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.closest(
      '[role="dialog"], [role="menu"], [role="listbox"], [data-slot="dropdown-menu-content"], [data-slot="select-content"]',
    ) !== null
  )
}
