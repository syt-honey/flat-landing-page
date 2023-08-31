export function getCurrentLanguage() {
    return location.pathname.split("/").filter(Boolean)[0] || "zh-CN"
}

export function isChinese() {
    return getCurrentLanguage() === "zh-CN"
}


export function generateModalItem({ value }, callback) {
    const p = document.createElement("p")
    p.innerHTML = value
    p.on("click", callback)
    return p
}

export function addModal({ id, bodyCls }) {
    const modalContainer = generateMobileModalContainer({ id, bodyCls })
    appendToBody(modalContainer)
    return modalContainer
}

function generateMobileModalContainer({ id, bodyCls }) {
    const div = document.createElement("div")
    div.setAttribute("id", id)

    div.innerHTML = `
        <div class="modal-mask modal-mask-mobile"></div>
        <div class="modal-wrap-mobile ${bodyCls}"></div>
    `

    return div
}

function appendToBody(el) {
    el && document.body.append(el)
}